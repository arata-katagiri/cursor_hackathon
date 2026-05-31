// BroQuest — give a quest (optionally preselected via ?to=<id>&round=<id>)
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFriends } from "@/lib/queries";
import GiveFlow, { type GiveFriend } from "@/components/broquest/GiveFlow";

export default async function GivePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; round?: string }>;
}) {
  const { to, round } = await searchParams;
  const profile = await requireProfile();
  const friends = await getFriends(profile.id);

  const list: GiveFriend[] = friends.map(({ profile: p, friendship }) => ({
    id: p.id,
    name: p.display_name,
    look: p.avatar_look,
    bondLevel: friendship.bond_level,
  }));

  // A round target may be a group member who isn't a friend — include them too.
  if (to && to !== profile.id && !list.some((f) => f.id === to)) {
    const supabase = await createClient();
    const { data: target } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_look")
      .eq("id", to)
      .single();
    if (target) {
      list.unshift({ id: target.id, name: target.display_name, look: target.avatar_look, bondLevel: 1 });
    }
  }

  return <GiveFlow friends={list} initialFid={to ?? null} roundId={round ?? null} />;
}
