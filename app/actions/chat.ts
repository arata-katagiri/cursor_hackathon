"use server";
// BroQuest — chat server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/db/types";

export async function sendMessage(chatId: string, body: string): Promise<ActionResult> {
  const user = await requireUser();
  const text = body.trim();
  if (!text) return { ok: false, error: "Empty message." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: user.id, body: text });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/chat/${chatId}`);
  return { ok: true };
}
