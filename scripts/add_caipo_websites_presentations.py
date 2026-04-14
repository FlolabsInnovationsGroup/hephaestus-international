#!/usr/bin/env python3
"""Ensure CAIPO presentation link from Websites & Presentations Fillout export exists as a contacted-stage resource."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from urllib import parse, request

# Re-use parser from main importer
import import_fillout_stage_content as importer


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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fillout-dir", default="../FloLabs_Hermes")
    parser.add_argument("--base-url", default="https://efestos.international")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    fillout_dir = Path(args.fillout_dir).resolve()
    path = fillout_dir / importer.STAGE_FILE_MAP["contacted"]
    if not path.exists():
        raise SystemExit(f"Missing {path}")

    resources = importer.parse_fillout_file(path)
    caipo = next((r for r in resources if "caipo" in r.title.lower()), None)
    if not caipo:
        raise SystemExit("No CAIPO resource found in Fillout export.")

    cookie = importer.login(args.base_url, args.email, args.password)
    existing = importer.stage_existing_urls(args.base_url, "contacted", cookie)
    if caipo.url in existing:
        print(f"CAIPO URL already present: {caipo.url}")
        return

    api_request(
        args.base_url,
        "POST",
        "/api/admin/stages/resources",
        {
            "stage": "contacted",
            "title": caipo.title,
            "url": caipo.url,
            "applicantPrompt": caipo.applicant_prompt,
        },
        cookie,
    )
    print(f"Added CAIPO resource: {caipo.title} -> {caipo.url}")


if __name__ == "__main__":
    main()
