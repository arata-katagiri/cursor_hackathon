// BroQuest — group circle detail: members + quest round
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/broquest/Avatar";
import RoundPanel, { type ActiveRound, type RoundMember } from "@/components/broquest/RoundPanel";
import type { Profile } from "@/lib/db/types";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: group } = await supabase.from("groups").select("*").eq("id", id).single();
  if (!group) notFound();

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id);
  const memberIds = (memberRows ?? []).map((m) => m.user_id);

  const { data: profiles } = await supabase.from("profiles").select("*").in("id", memberIds);
  const members: Profile[] = (profiles ?? []) as Profile[];

  const { data: rounds } = await supabase
    .from("quest_rounds")
    .select("*")
    .eq("group_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  const round: ActiveRound | null = rounds && rounds.length
    ? { id: rounds[0].id, assignments: rounds[0].assignments ?? [] }
    : null;

  const roundMembers: RoundMember[] = members.map((m) => ({ id: m.id, name: m.display_name }));

  return (
    <div>
      <div className="screen-title">{group.name}</div>
      <div className="screen-sub">{members.length} members</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "4px 18px 8px" }}>
        {members.map((m) => (
          <div key={m.id} style={{ textAlign: "center", width: 64 }}>
            <Avatar look={m.avatar_look} size={54} />
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: m.nickname_color }}>
              {m.id === profile.id ? "You" : m.display_name}
            </div>
          </div>
        ))}
      </div>

      <RoundPanel groupId={id} myId={profile.id} members={roundMembers} round={round} />
    </div>
  );
}
