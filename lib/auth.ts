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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Profile is normally created by the on_auth_user_created trigger. If it is
  // somehow missing, create a minimal one so the app never hard-crashes.
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email, display_name: user.email?.split("@")[0] ?? "Bro" })
      .select("*")
      .single();
    return created as Profile;
  }
  return profile as Profile;
}
