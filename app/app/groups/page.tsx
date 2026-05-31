// BroQuest — friend circles (groups)
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFriends } from "@/lib/queries";
import GroupsManager, { type GroupRow, type PickFriend } from "@/components/broquest/GroupsManager";

export default async function GroupsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);
  const groupIds = (memberships ?? []).map((m) => m.group_id);

  let groups: GroupRow[] = [];
  if (groupIds.length) {
    const [{ data: groupRows }, { data: allMembers }] = await Promise.all([
      supabase.from("groups").select("*").in("id", groupIds),
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
    ]);
    const counts = new Map<string, number>();
    for (const m of allMembers ?? []) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
    groups = (groupRows ?? []).map((g) => ({ id: g.id, name: g.name, memberCount: counts.get(g.id) ?? 1 }));
  }

  const friends = await getFriends(profile.id);
  const pick: PickFriend[] = friends.map(({ profile: p }) => ({ id: p.id, name: p.display_name, look: p.avatar_look }));

  return <GroupsManager groups={groups} friends={pick} />;
}
