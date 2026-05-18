# Stage Prompts Guide — HR Reference

This guide explains how stage passing conditions work, how to write effective AI review prompts, and how Paula Ferry operates.

---

## Section 1: Stage Passing Conditions Explained

Each pipeline stage has a **passing condition** that determines how an applicant advances to the next stage.

### The Three Conditions

| Condition | Plain English |
|---|---|
| `none` | The system advances the applicant automatically as soon as a "complete stage" action fires. No human or AI review is needed. |
| `hr` | A human HR team member must manually advance the applicant. The applicant stays on this stage until HR acts. |
| `ai` | OpenAI evaluates the applicant's submission against a customisable prompt. The AI decides whether to advance (`next`), keep them on the current stage (`stay`), or roll them back (`previous`). |

### Which Stage Uses Which Condition

| # | Stage ID | Label | Passing Condition |
|---|---|---|---|
| 1 | `application_submitted` | Application submitted | `none` — auto-advance |
| 2 | `new` | New | `none` — auto-advance |
| 3 | `contacted` | Websites and presentations | `ai` — AI review |
| 4 | `interested_review` | Interested review | `hr` — HR approval |
| 5 | `before_meeting` | Meeting recordings | `ai` — AI review |
| 6 | `meeting_recordings_submitted` | Meeting recordings submitted | `hr` — HR approval |
| 7 | `saturday_meeting` | Saturday meeting | `hr` — HR approval |
| 8 | `attended` | Masterclass assigned | `ai` — AI review |
| 9 | `masterclass_submitted` | Masterclass submitted | `hr` — HR approval |
| 10 | `second_meeting` | Oliver 1-on-1 | `hr` — HR approval (locked) |
| 11 | `agreement_sent` | Agreement sent | `hr` — HR approval (locked) |
| 12 | `agreement_signed` | Agreement signed | `hr` — HR approval (locked) |
| 13 | `chronos_synced` | Chronos synced | `hr` — HR approval (locked) |
| 14 | `joined` | Joined | `hr` — HR approval (locked) |

### What "Locked" Means

Stages 10–14 (`second_meeting`, `agreement_sent`, `agreement_signed`, `chronos_synced`, `joined`) are **locked**. This means:

- The passing condition is permanently set to `hr` and cannot be changed via the UI.
- The "No action required" and "AI evaluation" buttons are visible but disabled on these stages.
- The "Save condition" button is hidden.
- These stages represent the formal commitment and onboarding phase. Human judgement is mandatory — there is no automated bypass.

---

## Section 2: How to Edit the AI Review Prompt for a Stage

Only AI stages (`contacted`, `before_meeting`, `attended`) have an editable prompt. Follow these steps:

1. Log in to the HR dashboard at `/me/hr`.
2. Navigate to **Stages** (`/me/hr/stages`).
3. In the left panel, click the stage you want to edit (e.g. "Websites and presentations" for the `contacted` stage).
4. The right panel shows the **Passing condition** card.
5. Make sure **AI evaluation** is selected (it should already be selected for AI stages).
6. In the **AI evaluation prompt** textarea that appears below the buttons, type your reviewer instructions.
7. Click **Save condition**.
8. A "Saved" confirmation appears. The new prompt takes effect immediately for all future evaluations on that stage.

### What the Prompt Does

The text you enter becomes stage-specific reviewer instructions appended to the AI's system prompt. The AI reads it before evaluating the applicant's submission.

For example, for the `contacted` stage the system already instructs the AI to assess engagement with FloLabs content. Your custom prompt is appended as additional context, such as:

> "Pay special attention to whether the applicant identifies specific opportunities for FloLabs in their research."

The AI evaluates the applicant's chat messages for that stage and uses your prompt as extra guidance when deciding its verdict.

---

## Section 3: Writing Effective AI Prompts

### The 3 Outcomes

Every AI evaluation produces one of three outcomes:

| Outcome | Effect |
|---|---|
| `next` | The applicant advances to the next stage. |
| `stay` | The applicant remains on the current stage and must try again. |
| `previous` | The applicant is rolled back to the previous stage. Paula sends them an auto-message explaining why. |

The AI is configured to be **lenient on grammar** but **strict on genuine engagement**. A thoughtful, specific answer will pass even with typos.

### Good Prompts

Good prompts are short and specific. They tell the AI what to look for:

- "Check that the applicant has visited and described at least one of the shared links."
- "Verify the applicant mentions a specific problem FloLabs could solve, not just generic compliments."
- "The applicant should reference at least one recording they watched, not just acknowledge they exist."

### Bad Prompts

Avoid these patterns:

- **Too vague:** "Make sure the applicant is engaged." — The AI already checks for engagement. This adds nothing.
- **Too long:** Multi-paragraph essays confuse the model and dilute the signal.
- **Trying to override the 3-outcome system:** Writing "Always return next for nice answers" or inventing a fourth outcome will cause the evaluation to behave unpredictably.
- **Off-topic instructions:** The prompt is only for reviewing submissions; it cannot change Paula's chat style or the stage progression logic.

---

## Section 4: How Paula Ferry Works

### What Paula Is

Paula Ferry is a warm, professional HR chatbot who guides applicants through the FloLabs internship process. She answers questions about the current stage, explains what materials to review, and provides context about FloLabs.

### When Applicants See Paula

Paula is always visible to applicants in the **Q&A tab** of `/me/application`. Any applicant who can log in will see the chat interface with Paula.

### What Paula Can and Cannot Do

| Paula can | Paula cannot |
|---|---|
| Answer questions about what the current stage requires | Override HR decisions or manually advance stages |
| Explain FloLabs content and materials | Access private HR notes or other applicants' data |
| Send encouragement and process guidance | Commit to outcomes ("you will pass") |
| Deliver auto-messages after rollbacks | Change passing conditions or stage settings |

### Auto-Messages

Paula sends two types of auto-messages automatically — these are triggered by the system, not by HR:

1. **Low-effort rollback message:** When an applicant's submission is judged as low-effort, the AI returns `previous`, and Paula sends a message explaining the rollback and prompting the applicant to revisit the stage materials.
2. **Redo explanation message:** When the AI returns `stay`, Paula sends a message encouraging the applicant to try again with more depth.

### What HR Can Configure

HR can configure the **AI evaluation prompt** for each AI stage (see Section 2). That is the only thing that can be changed via the UI.

### What HR Cannot Change Without a Code Deploy

The following aspects of Paula are hardcoded and require a developer to change:

- Paula's greeting style and tone.
- Fallback responses (used when OpenAI is unavailable).
- Low-effort detection thresholds (word count, pattern matching).
- The 3-outcome evaluation logic (`next` / `stay` / `previous`).
- Which messages are sent automatically after rollbacks.

These settings live in `frontend/lib/application-store.ts`.

---

## Section 5: Troubleshooting

### "AI review isn't moving applicants forward"

1. Check that `OPENAI_API_KEY` is set in the App Runner environment variables.
2. Confirm the key is valid and has not expired (test it via the OpenAI playground).
3. Check if `LLM_MODEL` or `OPENAI_STAGE_REVIEW_MODEL` is set to an invalid model name. Remove these overrides to fall back to the default (`gpt-4.1-nano`).
4. Review App Runner logs for errors containing "OpenAI" or the model name.

### "AI returns `stay` for everyone"

The stage AI prompt is probably too strict. Open the stage in `/me/hr/stages`, soften the prompt (see Section 3 — Good Prompts), and save. Encourage a test applicant to re-submit to verify.

### "Applicant is stuck on a stage forever"

- **Passing condition = `hr`:** HR must manually advance the applicant via the stage controls on the HR dashboard. There is no automatic resolution.
- **Passing condition = `ai`:** Check the OpenAI configuration above. If the API is down, the applicant cannot advance until it is restored or HR manually overrides.
- **Passing condition = `none`:** The applicant should auto-advance on the next "complete stage" action. If they are stuck, check for application errors in the App Runner logs.

### "Paula gives robotic or generic answers"

The OpenAI API key is likely missing or expired. The app falls back to rule-based responses when OpenAI is unavailable. These rule-based responses are correct but intentionally brief. Adding or renewing the `OPENAI_API_KEY` environment variable in App Runner will restore full AI-powered responses.

After updating any environment variable in App Runner, wait for the service to redeploy before testing.
