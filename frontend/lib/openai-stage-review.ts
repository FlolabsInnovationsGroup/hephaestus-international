import OpenAI from 'openai';
import { getOpenAIApiKey, getOpenAIStageReviewModel } from '@/lib/openai-app-config';

export type StageReviewBlock = {
  stageId: string;
  stageTitle: string;
  stageDescription: string;
  items: { title: string; prompt: string; response: string }[];
  customAiPrompt?: string;
};

export type StageReviewOutcome = 'next' | 'stay' | 'previous';

export type BatchStageReviewDecision = {
  stageId: string;
  outcome: StageReviewOutcome;
  reason: string;
};

function normalizeOutcome(value: unknown): StageReviewOutcome | null {
  if (value === 'next' || value === 'stay' || value === 'previous') return value;
  if (value === 'advance') return 'next';
  if (value === 'regress' || value === 'back') return 'previous';
  return null;
}

/**
 * One OpenAI call evaluates every supplied stage (batch) to save tokens vs one call per stage.
 * Returns one outcome per `stages[].stageId` (validated against input).
 */
export async function reviewStagesBatch(
  stages: StageReviewBlock[],
  options?: { model?: string },
): Promise<{ decisions: BatchStageReviewDecision[]; error?: string }> {
  if (stages.length === 0) {
    return { decisions: [] };
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return { decisions: [], error: 'OpenAI is not configured (missing OPENAI_API_KEY).' };
  }

  const model = options?.model?.trim() || getOpenAIStageReviewModel();
  const openai = new OpenAI({ apiKey });

  const requiredIds = stages.map((s) => s.stageId);

  const stageNotes = stages
    .filter((s) => s.customAiPrompt?.trim())
    .map((s) => `- ${s.stageTitle} (${s.stageId}): ${s.customAiPrompt!.trim()}`)
    .join('\n');

  const systemPrompt = `You are a fair, consistent reviewer for FloLabs internship applicants.
Each block is one pipeline stage with question/answer pairs after the applicant consumed stage materials.

For EVERY stage in the JSON input you MUST return exactly one decision object with the same "stageId".

Outcomes (pick one per stage):
- "next": responses are substantive, on-prompt, and show genuine effort — ready for the very next pipeline step.
- "stay": mixed quality, too thin, or uneven — applicant should improve answers on this stage before advancing.
- "previous": clearly low effort overall (gibberish, one-word non-answers, obvious spam, hostile, or copy-paste filler across the stage) — use this sparingly, only for clearly unacceptable work.

Rules:
- Be lenient on grammar and non-native English when ideas and specifics are present.
- You must respond with a single JSON object only, no markdown, shape:
  { "decisions": [ { "stageId": string, "outcome": "next"|"stay"|"previous", "reason": string } ] }
- The "decisions" array must include every stageId from the input, in any order.${
    stageNotes ? `\n\nStage-specific reviewer instructions:\n${stageNotes}` : ''
  }`;

  // customAiPrompt is now in the system prompt; strip it from the user payload
  const userContent = JSON.stringify({ stages: stages.map(({ customAiPrompt: _, ...rest }) => rest) });

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.15,
      max_tokens: Math.min(1200, 180 + stages.length * 120),
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) {
      return { decisions: [], error: 'Empty model response.' };
    }
    const parsed = JSON.parse(raw) as { decisions?: unknown };
    const list = Array.isArray(parsed.decisions) ? parsed.decisions : [];
    const byStageId = new Map<string, BatchStageReviewDecision>();
    for (const row of list) {
      if (!row || typeof row !== 'object') continue;
      const r = row as { stageId?: unknown; outcome?: unknown; reason?: unknown };
      const stageId = typeof r.stageId === 'string' ? r.stageId : '';
      if (!stageId || !requiredIds.includes(stageId)) continue;
      const outcome = normalizeOutcome(r.outcome);
      if (!outcome) continue;
      const reason = typeof r.reason === 'string' ? r.reason : 'No reason provided.';
      byStageId.set(stageId, { stageId, outcome, reason });
    }
    for (const id of requiredIds) {
      if (!byStageId.has(id)) {
        return { decisions: [], error: 'Model omitted some stages; refusing partial batch.' };
      }
    }
    return { decisions: requiredIds.map((id) => byStageId.get(id)!) };
  } catch (error) {
    console.error('OpenAI batch stage review error:', error);
    return { decisions: [], error: 'Review service error.' };
  }
}
