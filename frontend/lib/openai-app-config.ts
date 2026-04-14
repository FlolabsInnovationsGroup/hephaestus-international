/**
 * OpenAI / LLM env alignment with Emails_automation (`src/config.py`):
 * - OPENAI_API_KEY
 * - LLM_MODEL (optional override; empty → provider default in Python; here we default to nano)
 *
 * Website-specific override for stage batch review:
 * - OPENAI_STAGE_REVIEW_MODEL (takes precedence over LLM_MODEL for reviews only)
 */

export function getOpenAIApiKey(): string | undefined {
  const k = process.env.OPENAI_API_KEY?.trim();
  return k || undefined;
}

/** Default matches Emails_automation `Config.effective_llm_model` when provider is OpenAI (`gpt-5.4-nano`). */
export const OPENAI_DEFAULT_NANO_MODEL = 'gpt-5.4-nano';

export function getOpenAIStageReviewModel(): string {
  return (
    process.env.OPENAI_STAGE_REVIEW_MODEL?.trim() ||
    process.env.LLM_MODEL?.trim() ||
    OPENAI_DEFAULT_NANO_MODEL
  );
}

/** Paula / general chat completions — same env chain, no separate stage key. */
export function getOpenAIChatModel(): string {
  return process.env.LLM_MODEL?.trim() || process.env.OPENAI_CHAT_MODEL?.trim() || OPENAI_DEFAULT_NANO_MODEL;
}
