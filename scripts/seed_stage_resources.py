"""
Seed stage resources for Hephaestus from old Fillout form exports.
Runs against production. Safe to re-run — skips stages that already have resources.
"""
import requests
import json
import sys

BASE_URL = "https://fykgssqbvg.us-east-1.awsapprunner.com"
SESSION_COOKIE = "fl_preview_session=fd541d23-87a5-4724-89c5-8ee654395924"

HEADERS = {
    "Content-Type": "application/json",
    "Cookie": SESSION_COOKIE,
}

# Stage resources to seed. Format: (stage_id, title, url, applicant_prompt)
RESOURCES = [
    # =========================================================
    # contacted — Websites & Presentations
    # =========================================================
    (
        "contacted",
        "FloLabs AI & Robotics Entrepreneurship Program",
        "https://www.canva.com/design/DAGXeLGWoFc/IWdzYrSNzWHZv3Fs_tZz5w/edit",
        (
            "Did the program overview give you a good sense of what we do and how it might apply to your interests?\n\n"
            "Are you interested in this program and can you briefly explain why?\n\n"
            "What skills or insights do you hope to gain from participating in this program?"
        ),
    ),
    (
        "contacted",
        "CAIPO Presentation",
        "https://www.canva.com/design/DAGPD2N0bE4/4LI6v69JXvmml9fOwKV0tw/edit",
        (
            "What did you like about the CAIPO design and concept?\n\n"
            "How do you think CAIPO could better communicate its value proposition in the presentation?"
        ),
    ),
    (
        "contacted",
        "CAIPO Website (caipo.ai)",
        "https://www.caipo.ai/",
        (
            "How would you describe what makes CAIPO different from other smart devices or wearables out there?\n\n"
            "How would you pitch CAIPO to a friend in 2-3 sentences?"
        ),
    ),
    (
        "contacted",
        "AI Travel Agent Presentation",
        "https://www.canva.com/design/DAF8oU7j-GQ/Pn49m_N0w9RTtdJDHcgF6Q/edit",
        "Does our AI Travel Agent clearly explain what we're building and how could we make it more intuitive or engaging?",
    ),
    (
        "contacted",
        "FlomadTravel.com",
        "https://www.flomadtravel.com/",
        (
            "Based on your experience exploring FlomadTravel.com, what features would you like to see added?\n\n"
            "What's your take on how our AI Travel Agent responds? Anything it does well or could do better?\n\n"
            "Imagine you're designing your ideal AI travel assistant — what features would it need to really impress you?"
        ),
    ),
    (
        "contacted",
        "Flo Labs Studios: The Frequency Podcast",
        "https://www.youtube.com/watch?v=X7q-rHHeFn0",
        (
            "What was the most thought-provoking insight you took away from the Frequency podcast and why?\n\n"
            "What specific changes or improvements would you suggest for the Frequency podcast, and what are the names of "
            "the participants and what were your impressions of them?"
        ),
    ),
    (
        "contacted",
        "MoodChanger.ai for Pets Podcast",
        "https://drive.google.com/file/d/1mOOMgAV8vuh9BrPa_QfLBSgC6VWXmkoa/view?usp=sharing",
        "What do you think about the Podcast and what key takeaway or insight stood out to you the most?",
    ),
    (
        "contacted",
        "MoodChanger.ai for Pets Presentation",
        "https://www.canva.com/design/DAGYja1TUd4/0uXWmOksp8B2tV22841r9g/view",
        (
            "What did you like about the MoodChanger.ai for Pets design and concept?\n\n"
            "How do you think MoodChanger.ai for Pets could better communicate its value proposition in the presentation?"
        ),
    ),
    (
        "contacted",
        "MoodChanger.ai Presentation",
        "https://www.canva.com/design/DAGbplfirz8/FLpZL5I_3MA1Iv6hUApoGg/view",
        (
            "What do you think about the MoodChanger.ai concept or design? Any standout ideas or areas to rethink?\n\n"
            "Were there any features of MoodChanger.ai that felt unnecessary or could be improved? If so, which ones and why?"
        ),
    ),
    (
        "contacted",
        "Intern Testimonial",
        "https://drive.google.com/file/d/1APPIX35pf45IWjKTFKmvruBH_OWK3SO1/view",
        "What stood out to you from the intern testimonials?",
    ),
    (
        "contacted",
        "NVIDIA CEO Jensen Huang GTC Keynote",
        "https://www.youtube.com/watch?v=k82RwXqZHY8",
        (
            "If you were to summarize the NVIDIA Keynote in three key takeaways, what would they be?\n\n"
            "Based on the keynote, what are your thoughts on how AI will evolve in the next five years?"
        ),
    ),
    (
        "contacted",
        "Hephaestus International (efestos.international)",
        "https://hephaestus.international/",
        (
            "After checking out hephaestus.international, what caught your attention? "
            "Do you have any suggestions for improvements? "
            "In terms of navigation and structure, how easy was it for you to find relevant information?"
        ),
    ),
    (
        "contacted",
        "FloLabs Innovations Website",
        "https://www.flolabsinnovations.com/",
        (
            "After exploring flolabsinnovations.com, which of our projects felt the most promising or exciting to you and why?\n\n"
            "What would you improve about the FloLabs website? Any suggestions on layout, visuals, or how we present things?\n\n"
            "We are in the era of advanced manufacturing and robotics. After watching the two videos on the FloLabs AI and Robotics "
            "page, what stood out to you — anything you loved, found confusing, or wanted more of?\n\n"
            "FloLabs is also launching RoboCollective.ai, focused on robot sales, rentals, entertainment, and media. Would you be "
            "interested in engaging with this startup project, and if so, how do you see yourself contributing?"
        ),
    ),
    # =========================================================
    # before_meeting — Meeting Recordings
    # =========================================================
    (
        "before_meeting",
        "All Team Meeting Recording",
        "https://us06web.zoom.us/rec/play/awsl67M_qYZth0lW2CSw7Gf7KdsU7pEs4uXQcV-Ynw_ijrkbYUa3I7EZnM0_KOTIrLPoupVqbKruFd57.4emkTDHfwF0DIUVH?autoplay=true&startTime=1769363553000",
        (
            "What key projects or updates presented during the All Team Meeting stood out to you the most, and why?\n\n"
            "Based on the meeting, which team or area would you be most interested in joining, and how do you think "
            "you can contribute to it?"
        ),
    ),
    (
        "before_meeting",
        "Innovation Boot-camp University Meeting",
        "https://app.read.ai/analytics/meetings/01JQCA2J448MPVNG1FZJ5VBXSH?utm_source=Share_CopyLink",
        (
            "What aspects of the Innovation Boot-camp University meeting resonated with you the most?\n\n"
            "What did you like about the Innovation Boot-camp University meeting and what do you think can be improved? "
            "(Note: the meeting starts at the 4-minute mark.)"
        ),
    ),
    (
        "before_meeting",
        "Projects Overview & Roboshow Recording",
        "https://drive.google.com/file/d/1tjhwlIurzTcoR7rfQIYHHzNGG9nI5F09/view?usp=sharing",
        (
            "What are the three modes of controlling robots for the Roboshow that the team discussed?\n\n"
            "What did you like about this meeting and what do you think can be improved?"
        ),
    ),
    (
        "before_meeting",
        "Meeting with NASA",
        "https://us06web.zoom.us/rec/share/sy9FCX8sgXBo4LCfHoyRTAKCRyOHmGmszUsar1dnX5JvvgENm0zdRRUzYyJ-iNeh.eTvEQTxd0krlB2w-",
        (
            "What role did teamwork and collaboration play in the projects discussed during the meeting? "
            "Provide specific examples.\n\n"
            "How do you think the ideas presented in the NASA meeting can be applied to future projects at FloLabs?"
        ),
    ),
    # =========================================================
    # attended — General Masterclass
    # =========================================================
    (
        "attended",
        "DeepSeek, China, OpenAI & AI Megaclusters — Lex Fridman Podcast",
        "https://www.youtube.com/watch?v=_1f-o0nqpEI",
        (
            "Please share your thoughts and feedback on the podcast.\n\n"
            "How do the insights shared in the podcast relate to our projects at FloLabs?"
        ),
    ),
    (
        "attended",
        "Prompt Engineering — OpenAI Guide",
        "https://platform.openai.com/docs/guides/text#prompt-engineering",
        (
            "Please share your thoughts and feedback on the article.\n\n"
            "How does prompt engineering relate to our projects at FloLabs?"
        ),
    ),
    (
        "attended",
        "Talking to Animals Using AI",
        "https://ig.ft.com/ai-animals/",
        (
            "Please share your thoughts and feedback on the article.\n\n"
            "How does it relate to our projects at FloLabs?"
        ),
    ),
    (
        "attended",
        "Is Consciousness an Illusion?",
        "https://www.youtube.com/watch?v=BjmPvovl-V4",
        (
            "Please share your thoughts and feedback on the video.\n\n"
            "How does the philosophical perspective on consciousness relate to our work at FloLabs?"
        ),
    ),
    (
        "attended",
        "Meetings with Admiral Bobby Ray Inman — Session 1",
        "https://app.read.ai/analytics/meetings/01HW8QP420A77E3JEFTN8ACSHS?section=notes",
        "",  # No prompt on Session 1 — watch before Session 2
    ),
    (
        "attended",
        "Meetings with Admiral Bobby Ray Inman — Session 2",
        "https://app.read.ai/analytics/meetings/01J6D53G4R0WC53M8XR638KERZ?utm_source=Share_CopyLink",
        (
            "After comparing the second meeting recording to the first one with Admiral Inman, "
            "what progress or new directions stood out to you the most?"
        ),
    ),
]


def get_existing_resources():
    resp = requests.get(f"{BASE_URL}/api/admin/stages/resources", headers=HEADERS)
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    return resp.json().get("resources", [])


def seed():
    print("Checking existing stage resources...")
    try:
        existing = get_existing_resources()
    except Exception as e:
        print(f"Could not fetch existing resources: {e}")
        existing = []

    existing_by_stage = {}
    for r in existing:
        stage = r.get("stage", "")
        existing_by_stage.setdefault(stage, []).append(r.get("title", ""))

    seeded = 0
    skipped = 0
    for stage, title, url, prompt in RESOURCES:
        if title in existing_by_stage.get(stage, []):
            print(f"  SKIP  [{stage}] {title}")
            skipped += 1
            continue
        payload = {"stage": stage, "title": title, "url": url, "applicantPrompt": prompt}
        resp = requests.post(
            f"{BASE_URL}/api/admin/stages/resources",
            headers=HEADERS,
            json=payload,
        )
        if resp.ok:
            print(f"  OK    [{stage}] {title}")
            seeded += 1
        else:
            print(f"  FAIL  [{stage}] {title}  →  {resp.status_code} {resp.text[:120]}", file=sys.stderr)

    print(f"\nDone. Seeded: {seeded}, Skipped (already present): {skipped}")


if __name__ == "__main__":
    seed()
