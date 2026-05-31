"use server";
// BroQuest — friends server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/db/types";

/** Send a friend request by email or display name. */
export async function sendFriendRequest(query: string): Promise<ActionResult> {
  const user = await requireUser();
  const q = query.trim();
  if (!q) return { ok: false, error: "Enter a friend's email or name." };

  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .or(`email.eq.${q},display_name.eq.${q}`)
    .limit(2);

  if (!matches || matches.length === 0) return { ok: false, error: "No one found with that email/name." };
  if (matches.length > 1) return { ok: false, error: "Multiple matches — use their exact email." };
  const target = matches[0];
  if (target.id === user.id) return { ok: false, error: "That's you 🙂" };

  // Already linked either direction?
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`
    )
    .limit(1);
  if (existing && existing.length) {
    const s = existing[0].status;
    return { ok: false, error: s === "accepted" ? "Already friends!" : "Request already pending." };
  }

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: target.id, status: "pending" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/friends");
  return { ok: true };
}

export async function respondToRequest(
  friendshipId: string,
  accept: boolean
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/friends");
  revalidatePath("/app");
  return { ok: true };
}
