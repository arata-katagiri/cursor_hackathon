// BroQuest — server-side auth helpers
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

/** Current authenticated user (or null). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a logged-in user; redirect to /login if none. Returns the user. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a user and return their profile row (redirects to /login if no user). */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (selectError) {
    console.error("requireProfile: Select error for user", user.id, selectError);
  }

  // Profile is normally created by the on_auth_user_created trigger. If it is
  // somehow missing, create a minimal one so the app never hard-crashes.
  if (!profile) {
    console.warn("requireProfile: Profile missing for user", user.id, "attempting to create default...");
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email, display_name: user.email?.split("@")[0] ?? "Bro" })
      .select("*")
      .single();
    if (insertError) {
      console.error("requireProfile: Insert error for user", user.id, insertError);
    }
    if (!created) {
      console.error("requireProfile: Failed to create profile for user", user.id);
      // Return a fallback profile object to prevent AppLayout from hard-crashing on null
      return {
        id: user.id,
        email: user.email,
        display_name: user.email?.split("@")[0] ?? "Bro",
        nickname: null,
        nickname_color: "#1cb0f6",
        coin_balance: 100,
        streak_count: 0,
        streak_last_fed: null,
        avatar_look: { skin: "#f1c89f", hair: "short", hairColor: "#3a2b1f", acc: "none" },
        created_at: new Date().toISOString()
      } as Profile;
    }
    return created as Profile;
  }
  return profile as Profile;
}
