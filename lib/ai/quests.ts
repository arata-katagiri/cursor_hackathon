// BroQuest — AI quest generation (OpenAI) with a safe local fallback.
// Server-only: never import into a client component (uses OPENAI_API_KEY).

export type GenMode = "ai_assisted" | "ai_full";

export interface GenInput {
  mode: GenMode;
  giverName: string;
  receiverName: string;
  /** Free-text relationship / group context, e.g. "day-one friends, bond Lv.4". */
  context?: string;
  /** User's seed idea (required for ai_assisted, ignored for ai_full). */
  seed?: string;
  /** chill | solid | beast */
  difficulty?: string;
  category?: string;
  /** Recent quest texts to avoid repeating. */
  history?: string[];
}

export interface GenQuest {
  title: string;
  description: string;
  suggestedCoins: number;
  proofRequired: boolean;
  tone: string;
  category: string;
}

const DIFFICULTY_COINS: Record<string, number> = { chill: 20, solid: 50, beast: 100 };
const CATEGORIES = ["fitness", "social", "mind", "create", "food", "dare"];

function clampCoins(n: unknown, difficulty?: string): number {
  const fallback = DIFFICULTY_COINS[difficulty ?? "solid"] ?? 50;
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(200, Math.max(10, v));
}

const SYSTEM_PROMPT = `You are BroQuest's quest writer. You craft short, fun, friendly challenges that one friend dares another to do today.
Rules:
- Keep quests SAFE, legal, kind, and non-harmful. Refuse dangerous, illegal, sexual, or humiliating dares — instead produce a wholesome alternative.
- Make it specific and doable within a day.
- Title: punchy, <= 6 words, may include one emoji.
- Description: 1-2 sentences, second person ("you"), encouraging tone.
- Respond ONLY with strict JSON matching the requested schema.`;

function buildUserPrompt(input: GenInput): string {
  const parts: string[] = [];
  parts.push(`Giver: ${input.giverName}`);
  parts.push(`Receiver: ${input.receiverName}`);
  if (input.context) parts.push(`Context: ${input.context}`);
  if (input.category) parts.push(`Category hint: ${input.category}`);
  if (input.difficulty) parts.push(`Difficulty: ${input.difficulty}`);
  if (input.mode === "ai_assisted" && input.seed) parts.push(`User's idea to expand: "${input.seed}"`);
  if (input.mode === "ai_full") parts.push(`No user idea — invent a fitting quest from the context.`);
  if (input.history?.length) parts.push(`Avoid repeating these recent quests: ${input.history.join(" | ")}`);
  parts.push(
    `Return JSON: { "title": string, "description": string, "suggestedCoins": number (10-200), "proofRequired": boolean, "tone": string, "category": one of ${CATEGORIES.join("/")} }`
  );
  return parts.join("\n");
}

// ── Local fallback (no API key / API error) ──────────────────────────────────
const TEMPLATES: Record<string, { title: string; body: (r: string) => string }[]> = {
  fitness: [
    { title: "Sunrise Sprint 🌄", body: (r) => `${r}, run to the highest spot near you and snap the view.` },
    { title: "30 & Done 💪", body: () => `Knock out 30 push-ups before your next meal.` },
  ],
  social: [
    { title: "Spread Love 💛", body: () => `Text 3 people something genuinely nice right now.` },
    { title: "Call a Legend ☎️", body: () => `Call someone you haven't talked to in a month.` },
  ],
  mind: [
    { title: "Touch Grass 🌱", body: () => `No phone for 2 hours. Go be a real human outside.` },
    { title: "Brain Reset 🧠", body: () => `Read 10 pages of a book before bed tonight.` },
  ],
  create: [
    { title: "Make Something 🎨", body: () => `Create one tiny thing — doodle, beat, or poem — and share it.` },
  ],
  food: [
    { title: "Chef Mode 👨‍🍳", body: () => `Cook a dish you've never made before today.` },
  ],
  dare: [
    { title: "Bold Move 😈", body: (r) => `${r}, do one slightly scary-but-good thing you've been avoiding.` },
  ],
};

function fallbackQuest(input: GenInput): GenQuest {
  const cat = CATEGORIES.includes(input.category ?? "") ? (input.category as string) : "dare";
  const pool = TEMPLATES[cat] ?? TEMPLATES.dare;
  // Deterministic-ish pick from seed/receiver so it isn't random in render contexts.
  const idx = (input.seed?.length ?? input.receiverName.length) % pool.length;
  const t = pool[idx];
  const seedHint = input.mode === "ai_assisted" && input.seed ? ` (${input.seed.trim()})` : "";
  return {
    title: t.title,
    description: t.body(input.receiverName) + seedHint,
    suggestedCoins: clampCoins(undefined, input.difficulty),
    proofRequired: input.difficulty === "beast",
    tone: "hype",
    category: cat,
  };
}

/** Generate a quest. Uses OpenAI when OPENAI_API_KEY is set, else a local template. */
export async function generateQuest(input: GenInput): Promise<GenQuest> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your-")) return fallbackQuest(input);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
      // Don't let a slow model hang the request forever.
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("empty completion");
    const parsed = JSON.parse(raw) as Partial<GenQuest>;

    const category = CATEGORIES.includes(parsed.category ?? "")
      ? (parsed.category as string)
      : input.category && CATEGORIES.includes(input.category)
        ? input.category
        : "dare";

    return {
      title: (parsed.title ?? "Your Quest ✦").toString().slice(0, 80),
      description: (parsed.description ?? "").toString().slice(0, 400),
      suggestedCoins: clampCoins(parsed.suggestedCoins, input.difficulty),
      proofRequired: Boolean(parsed.proofRequired),
      tone: (parsed.tone ?? "hype").toString().slice(0, 24),
      category,
    };
  } catch {
    return fallbackQuest(input);
  }
}
