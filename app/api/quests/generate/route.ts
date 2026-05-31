// BroQuest — AI quest generation endpoint.
// POST { mode, receiverId?, receiverName?, context?, seed?, difficulty?, category?, history? }
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateQuest, type GenInput } from "@/lib/ai/quests";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Partial<GenInput> & { receiverId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const mode = body.mode === "ai_full" ? "ai_full" : "ai_assisted";
  if (mode === "ai_assisted" && !body.seed?.trim()) {
    return NextResponse.json({ error: "seed required for ai_assisted" }, { status: 400 });
  }

  const supabase = await createClient();

  // Resolve giver + receiver display names for richer prompts.
  let giverName = user.email?.split("@")[0] ?? "A friend";
  let receiverName = body.receiverName ?? "your friend";
  const ids = [user.id, body.receiverId].filter(Boolean) as string[];
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    for (const p of profiles ?? []) {
      if (p.id === user.id) giverName = p.display_name;
      if (p.id === body.receiverId) receiverName = p.display_name;
    }
  }

  const quest = await generateQuest({
    mode,
    giverName,
    receiverName,
    context: body.context,
    seed: body.seed,
    difficulty: body.difficulty,
    category: body.category,
    history: body.history,
  });

  return NextResponse.json({ quest });
}
