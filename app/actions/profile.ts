"use server";
// BroQuest — profile server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult, AvatarLook } from "@/lib/db/types";

export async function updateProfile(input: {
  displayName?: string;
  nickname?: string;
  look?: AvatarLook;
}): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim() || "Bro";
  if (input.nickname !== undefined) patch.nickname = input.nickname.trim();
  if (input.look !== undefined) patch.avatar_look = input.look;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { ok: true };
}
