"use server";
// BroQuest — shop & cosmetics server actions
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult, AvatarLook, Cosmetic } from "@/lib/db/types";

export async function buyCosmetic(cosmeticId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_cosmetic", { p_cosmetic: cosmeticId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/shop");
  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { ok: true };
}

/** Equip (or unequip if already on) a cosmetic, applying its visual to the profile. */
export async function toggleEquip(cosmeticId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: cosmetic } = await supabase
    .from("cosmetics")
    .select("*")
    .eq("id", cosmeticId)
    .single<Cosmetic>();
  if (!cosmetic) return { ok: false, error: "Cosmetic not found." };

  const { data: invItem } = await supabase
    .from("inventory")
    .select("equipped")
    .eq("user_id", user.id)
    .eq("cosmetic_id", cosmeticId)
    .single();
  if (!invItem) return { ok: false, error: "You don't own this yet." };

  const turningOn = !invItem.equipped;

  if (turningOn) {
    // Unequip other items in the same category first.
    const { data: sameCat } = await supabase
      .from("cosmetics")
      .select("id")
      .eq("category", cosmetic.category);
    const ids = (sameCat ?? []).map((c) => c.id);
    if (ids.length) {
      await supabase
        .from("inventory")
        .update({ equipped: false })
        .eq("user_id", user.id)
        .in("cosmetic_id", ids);
    }
  }

  await supabase
    .from("inventory")
    .update({ equipped: turningOn })
    .eq("user_id", user.id)
    .eq("cosmetic_id", cosmeticId);

  // Reflect the change on the profile so avatars/nicknames update everywhere.
  await applyCosmeticToProfile(user.id, cosmetic, turningOn);

  revalidatePath("/app/profile");
  revalidatePath("/app/shop");
  revalidatePath("/app");
  return { ok: true };
}

async function applyCosmeticToProfile(userId: string, cosmetic: Cosmetic, on: boolean) {
  const supabase = await createClient();

  if (cosmetic.category === "nickname_color") {
    await supabase
      .from("profiles")
      .update({ nickname_color: on ? cosmetic.asset_ref : "#1cb0f6" })
      .eq("id", userId);
    return;
  }

  if (cosmetic.category === "accessory") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_look")
      .eq("id", userId)
      .single();
    const look: AvatarLook = (profile?.avatar_look as AvatarLook) ?? {
      skin: "#f1c89f",
      hair: "short",
      hairColor: "#3a2b1f",
      acc: "none",
    };
    const acc = cosmetic.asset_ref === "cap" ? "cap" : "glasses";
    look.acc = on ? acc : "none";
    if (on && acc === "cap") look.capColor = "#2f6df0";
    await supabase.from("profiles").update({ avatar_look: look }).eq("id", userId);
  }
  // flame_decoration: equip state on inventory is enough; profile screen reads it.
}
