// BroQuest — submit a proof photo for a quest and get an AI review.
// POST { questId: string, imageBase64: string (data URL) }
// Optional feature: failures are soft — the quest can always be completed without it.
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewProof } from "@/lib/ai/review";
import type { Quest } from "@/lib/db/types";

const MAX_DATA_URL = 12_000_000; // ~9MB of binary; client downscales well below this.
const BUCKET = "quest-proofs";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { questId?: string; imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const questId = body.questId?.trim();
  const dataUrl = body.imageBase64;
  if (!questId || !dataUrl) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  if (!dataUrl.startsWith("data:image/")) return NextResponse.json({ error: "not an image" }, { status: 400 });
  if (dataUrl.length > MAX_DATA_URL) return NextResponse.json({ error: "image too large" }, { status: 413 });

  const supabase = await createClient();

  // Only the receiver of the quest may submit proof.
  const { data: quest } = await supabase
    .from("quests")
    .select("id, receiver_id, title, description, category, status")
    .eq("id", questId)
    .single();
  if (!quest) return NextResponse.json({ error: "quest not found" }, { status: 404 });
  if (quest.receiver_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Decode the data URL → bytes.
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) return NextResponse.json({ error: "bad image data" }, { status: 400 });
  const contentType = match[1];
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    return NextResponse.json({ error: "bad image data" }, { status: 400 });
  }

  // 1) Upload to storage (best-effort — review still runs if this fails).
  let imageUrl: string | null = null;
  try {
    const path = `${user.id}/${questId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
    if (!upErr) {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      imageUrl = pub?.publicUrl ?? null;
    }
  } catch {
    /* storage optional */
  }

  // 2) AI review (has its own internal fallback).
  const review = await reviewProof({
    title: quest.title,
    description: quest.description,
    category: quest.category,
    imageDataUrl: dataUrl,
  });

  // 3) Persist on the quest (best-effort). Nudge status to "submitted" so the
  //    giver notices, unless it's already completed.
  try {
    const patch: Record<string, unknown> = {
      ai_score: review.score,
      ai_verdict: review.verdict,
      ai_feedback: review.feedback,
      proof_reviewed_at: new Date().toISOString(),
    };
    if (imageUrl) patch.proof_image_url = imageUrl;
    if ((quest as Quest).status !== "completed") patch.status = "submitted";
    await supabase.from("quests").update(patch).eq("id", questId);
  } catch {
    /* persistence optional — still return the review to the user */
  }

  return NextResponse.json({ ok: true, review, imageUrl });
}
