#!/usr/bin/env python3
import argparse
import json
import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any
from urllib import parse, request


@dataclass
class StageResource:
    title: str
    url: str
    applicant_prompt: str


STAGE_FILE_MAP = {
    "contacted": "Websites & Presentations.json",
    "before_meeting": "Meeting Recordings.json",
    "attended": "General Masterclass.json",
}


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def get_nested(source: dict[str, Any], path: list[str], default: str = "") -> str:
    value: Any = source
    for key in path:
        if not isinstance(value, dict) or key not in value:
            return default
        value = value[key]
    return str(value or default)


def _urls_from_step_json(step: dict[str, Any]) -> list[str]:
    """Collect http(s) links from an entire form step (Fillout stores URLs in Paragraph HTML,
    button targets, etc.). Exclude Fillout CDN screenshots so we keep real presentation links."""
    blob = json.dumps(step)
    raw_links = re.findall(r"https?://[^\s\"<>\\]+", blob)
    cleaned: list[str] = []
    for link in raw_links:
        link = link.replace("&amp;", "&").rstrip("\\").strip()
        if not link:
            continue
        if "images.fillout.com" in link:
            continue
        if "fillout.com/t/" in link or "api.fillout.com" in link:
            continue
        cleaned.append(link)
    return list(dict.fromkeys(cleaned))


def parse_fillout_file(file_path: Path) -> list[StageResource]:
    raw = json.loads(file_path.read_text(encoding="utf-8"))
    steps = raw.get("template", {}).get("steps", {})
    resources: list[StageResource] = []

    for step in steps.values():
        if step.get("type") != "form":
            continue
        step_name = str(step.get("name", "Stage content")).strip() or "Stage content"
        widgets = step.get("template", {}).get("widgets", {})
        links: list[str] = []
        prompts: list[str] = []

        for widget in widgets.values():
            widget_type = widget.get("type")
            template = widget.get("template", {})

            if widget_type == "Paragraph":
                html = get_nested(template, ["contents", "logic", "value"])
                links.extend(re.findall(r'href="(https?://[^"]+)"', html))
                # fallback for plaintext links if href is not used
                links.extend(re.findall(r"https?://[^\s<>\"]+", html))

            if widget_type == "LongAnswer":
                label_html = get_nested(template, ["label", "logic", "value"])
                prompt = strip_html(label_html)
                if prompt:
                    prompts.append(prompt)

        # Catch URLs that only appear in non-Paragraph widgets or odd HTML (e.g. CAIPO Canva in body copy).
        for link in _urls_from_step_json(step):
            if link not in links:
                links.append(link)

        deduped_links = list(dict.fromkeys(link.strip() for link in links if link.strip()))
        if not deduped_links:
            continue

        if prompts:
            prompt_text = "Please share your take on this content:\n- " + "\n- ".join(prompts)
        else:
            prompt_text = "Please share your key takeaways from this content."

        for index, link in enumerate(deduped_links, start=1):
            title = step_name if len(deduped_links) == 1 else f"{step_name} ({index})"
            resources.append(
                StageResource(
                    title=title,
                    url=link.replace("&amp;", "&"),
                    applicant_prompt=prompt_text,
                )
            )

    return resources


def api_request(base_url: str, method: str, path: str, body: dict[str, Any] | None = None, cookie: str | None = None) -> dict[str, Any]:
    full_url = parse.urljoin(base_url, path)
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = request.Request(full_url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if cookie:
        req.add_header("Cookie", cookie)
    with request.urlopen(req) as response:
        payload = response.read().decode("utf-8") or "{}"
        return json.loads(payload)


def login(base_url: str, email: str, password: str) -> str:
    req = request.Request(
        parse.urljoin(base_url, "/api/auth/preview-login"),
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with request.urlopen(req) as response:
        cookie_headers = response.headers.get_all("Set-Cookie") or []
        if not cookie_headers:
            raise RuntimeError("Login succeeded but no session cookie returned.")
        for header in cookie_headers:
            if header.startswith("fl_preview_session="):
                return header.split(";", 1)[0]
    raise RuntimeError("Could not find fl_preview_session cookie in login response.")


def stage_existing_urls(base_url: str, stage: str, cookie: str) -> set[str]:
    payload = api_request(base_url, "GET", f"/api/admin/stages/resources?stage={parse.quote(stage)}", cookie=cookie)
    return {str(item.get("url", "")).strip() for item in payload.get("resources", [])}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Fillout export JSON content into stage resources.")
    parser.add_argument("--fillout-dir", default="../FloLabs_Hermes", help="Directory containing Fillout JSON exports.")
    parser.add_argument("--base-url", default="https://efestos.international", help="Target site URL.")
    parser.add_argument("--email", required=True, help="HR account email.")
    parser.add_argument("--password", required=True, help="HR account password.")
    args = parser.parse_args()

    fillout_dir = Path(args.fillout_dir).resolve()
    cookie = login(args.base_url, args.email, args.password)

    created_total = 0
    for stage, file_name in STAGE_FILE_MAP.items():
        file_path = fillout_dir / file_name
        if not file_path.exists():
            print(f"[skip] Missing export file: {file_path}")
            continue
        resources = parse_fillout_file(file_path)
        existing_urls = stage_existing_urls(args.base_url, stage, cookie)
        created_stage = 0

        for resource in resources:
            if resource.url in existing_urls:
                continue
            api_request(
                args.base_url,
                "POST",
                "/api/admin/stages/resources",
                {
                    "stage": stage,
                    "title": resource.title,
                    "url": resource.url,
                    "applicantPrompt": resource.applicant_prompt,
                },
                cookie,
            )
            existing_urls.add(resource.url)
            created_stage += 1
            created_total += 1

        print(f"[{stage}] parsed={len(resources)} created={created_stage} total_existing={len(existing_urls)}")

    print(f"Import complete. Total created resources: {created_total}")


if __name__ == "__main__":
    main()
