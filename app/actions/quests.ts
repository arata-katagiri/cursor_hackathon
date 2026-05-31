"use server";
// BroQuest — quest lifecycle server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type {
  ActionResult,
  CompleteResult,
  CreateQuestInput,
  Quest,
} from "@/lib/db/types";

/** Find an existing direct chat between two users, or create one. */
async function ensureDirectChat(a: string, b: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", a);
  const myChatIds = (mine ?? []).map((r) => r.chat_id);
  if (myChatIds.length) {
    const { data: shared } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", b)
      .in("chat_id", myChatIds);
    const sharedIds = (shared ?? []).map((r) => r.chat_id);
    if (sharedIds.length) {
      const { data: direct } = await supabase
        .from("chats")
        .select("id")
        .eq("type", "direct")
        .in("id", sharedIds)
        .limit(1);
      if (direct && direct.length) return direct[0].id;
    }
  }
  // Create a fresh direct chat.
  const { data: chat, error } = await supabase
    .from("chats")
    .insert({ type: "direct" })
    .select("id")
    .single();
  if (error || !chat) return null;
  await supabase.from("chat_participants").insert([
    { chat_id: chat.id, user_id: a },
    { chat_id: chat.id, user_id: b },
  ]);
  return chat.id;
}

export async function createQuest(input: CreateQuestInput): Promise<ActionResult<Quest>> {
  const user = await requireUser();
  if (!input.receiverId) return { ok: false, error: "Pick a friend." };
  if (!input.description.trim() && !input.title.trim())
    return { ok: false, error: "Quest can't be empty." };

  const supabase = await createClient();
  const chatId = await ensureDirectChat(user.id, input.receiverId);

  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      chat_id: chatId,
      giver_id: user.id,
      receiver_id: input.receiverId,
      title: input.title.trim() || input.description.trim().slice(0, 60),
      description: input.description.trim(),
      reward_coins: Math.min(200, Math.max(10, Math.round(input.rewardCoins) || 50)),
      proof_required: input.proofRequired ?? false,
      author_mode: input.authorMode ?? "manual",
      category: input.category ?? "dare",
      gesture: input.gesture ?? "fist",
      round_id: input.roundId ?? null,
      status: "assigned",
    })
    .select("*")
    .single();
  if (error || !quest) return { ok: false, error: error?.message ?? "Could not create quest." };

  // Drop a chat message referencing the quest so it shows inline.
  if (chatId) {
    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      body: `🎯 New quest: ${quest.title}`,
      quest_id: quest.id,
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/quests");
  return { ok: true, data: quest as Quest };
}

export async function setQuestStatus(
  questId: string,
  status: "in_progress" | "submitted",
  proofText?: string
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (proofText !== undefined) patch.proof_text = proofText;
  const { error } = await supabase.from("quests").update(patch).eq("id", questId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/quests");
  return { ok: true };
}

export async function completeQuest(questId: string): Promise<ActionResult<CompleteResult>> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: quest, error } = await supabase.rpc("complete_quest", { p_quest: questId });
  if (error) return { ok: false, error: error.message };

  // The reward goes to the receiver; fetch the affected profile for the celebration.
  const receiverId = (quest as Quest)?.receiver_id ?? user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("coin_balance, streak_count")
    .eq("id", receiverId)
    .single();

  revalidatePath("/app");
  revalidatePath("/app/quests");
  revalidatePath("/app/profile");
  return {
    ok: true,
    data: {
      rewardCoins: (quest as Quest)?.reward_coins ?? 0,
      coinBalance: profile?.coin_balance ?? 0,
      streakCount: profile?.streak_count ?? 0,
    },
  };
}
