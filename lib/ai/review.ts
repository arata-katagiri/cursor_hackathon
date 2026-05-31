// BroQuest — AI proof review (OpenAI vision) with a safe local fallback.
// Server-only: never import into a client component (uses OPENAI_API_KEY).
import type { ProofReview } from "@/lib/db/types";

export interface ReviewInput {
  title: string;
  description: string;
  category?: string;
  /** Full data URL: `data:image/jpeg;base64,...`. */
  imageDataUrl: string;
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 70;
  return Math.min(100, Math.max(0, v));
}

const SYSTEM_PROMPT = `You are BroQuest's friendly quest judge. A user submitted a PHOTO as proof they completed a fun dare/challenge a friend gave them. Look at the image and decide how well it shows the quest was done.
Rules:
- Be encouraging, warm, and playful — this is a social game, not an exam. Most genuine attempts should pass.
- Only fail (passed=false, low score) if the photo is clearly empty, unrelated, or obviously not an attempt.
- NEVER comment on a person's identity, body, weight, or attractiveness. Never be mean, creepy, or judgmental about appearance.
- Reference what you actually see in the photo, briefly and kindly.
- Respond ONLY with strict JSON matching the requested schema.`;

function buildUserText(input: ReviewInput): string {
  return [
    `Quest title: ${input.title}`,
    `Quest details: ${input.description || input.title}`,
    input.category ? `Category: ${input.category}` : "",
    `Return JSON: { "score": number 0-100 (how convincingly the photo proves the quest is done), "verdict": short hype headline <= 6 words (may include one emoji), "feedback": 1-2 short encouraging sentences about what you see, "passed": boolean }`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Honest fallback when AI is unavailable — never blocks the user.
function fallbackReview(): ProofReview {
  return {
    score: 80,
    verdict: "Proof received 📸",
    feedback: "Photo saved! AI review is offline right now, but this looks legit.",
    passed: true,
  };
}

/** Review a proof photo against a quest. Uses OpenAI vision, else a safe fallback. */
export async function reviewProof(input: ReviewInput): Promise<ProofReview> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your-")) return fallbackReview();
  if (!input.imageDataUrl?.startsWith("data:image/")) return fallbackReview();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: buildUserText(input) },
              { type: "image_url", image_url: { url: input.imageDataUrl, detail: "low" } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("empty completion");
    const parsed = JSON.parse(raw) as Partial<ProofReview>;

    const score = clampScore(parsed.score);
    return {
      score,
      verdict: (parsed.verdict ?? "Nice work!").toString().slice(0, 60),
      feedback: (parsed.feedback ?? "").toString().slice(0, 300),
      passed: typeof parsed.passed === "boolean" ? parsed.passed : score >= 50,
    };
  } catch {
    return fallbackReview();
  }
}
