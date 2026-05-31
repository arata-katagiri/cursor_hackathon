"use server";
// BroQuest — groups & quest rounds server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/db/types";

export async function createGroup(name: string, memberIds: string[] = []): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name your circle." };

  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name: trimmed, owner_id: user.id })
    .select("id")
    .single();
  if (error || !group) return { ok: false, error: error?.message ?? "Could not create group." };

  // Owner + selected friends become members; a group chat backs the circle.
  const members = [...new Set([user.id, ...memberIds])];
  await supabase.from("group_members").insert(members.map((uid) => ({ group_id: group.id, user_id: uid })));

  const { data: chat } = await supabase
    .from("chats")
    .insert({ type: "group", group_id: group.id })
    .select("id")
    .single();
  if (chat) {
    await supabase
      .from("chat_participants")
      .insert(members.map((uid) => ({ chat_id: chat.id, user_id: uid })));
  }

  revalidatePath("/app/groups");
  return { ok: true, data: { id: group.id } };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/groups");
  return { ok: true };
}

/** Build a single-cycle derangement (no one targets themselves). */
function singleCycle<T>(items: T[]): { giver: T; receiver: T }[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((giver, i) => ({ giver, receiver: shuffled[(i + 1) % shuffled.length] }));
}

export async function startRound(groupId: string): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length < 2) return { ok: false, error: "Need at least 2 members for a round." };

  // Close any still-active round, then open a new one.
  await supabase.from("quest_rounds").update({ status: "done" }).eq("group_id", groupId).eq("status", "active");

  const assignments = singleCycle(ids);
  const { data: round, error } = await supabase
    .from("quest_rounds")
    .insert({ group_id: groupId, status: "active", assignments })
    .select("id")
    .single();
  if (error || !round) return { ok: false, error: error?.message ?? "Could not start round." };

  revalidatePath(`/app/groups/${groupId}`);
  return { ok: true, data: { id: round.id } };
}
