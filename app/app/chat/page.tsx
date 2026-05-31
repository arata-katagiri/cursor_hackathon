// BroQuest — list of chat threads
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

export default async function ChatListPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: myParts } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", profile.id);
  const chatIds = (myParts ?? []).map((p) => p.chat_id);

  let rows: { id: string; title: string; emoji: string }[] = [];
  if (chatIds.length) {
    const [{ data: chats }, { data: allParts }] = await Promise.all([
      supabase.from("chats").select("*").in("id", chatIds),
      supabase.from("chat_participants").select("chat_id, user_id").in("chat_id", chatIds),
    ]);

    const otherIds = (allParts ?? []).map((p) => p.user_id).filter((id) => id !== profile.id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", otherIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, (p as Profile).display_name]));

    const groupIds = (chats ?? []).map((c) => c.group_id).filter(Boolean) as string[];
    const { data: groups } = groupIds.length
      ? await supabase.from("groups").select("id, name").in("id", groupIds)
      : { data: [] };
    const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));

    rows = (chats ?? []).map((c) => {
      if (c.type === "group") {
        return { id: c.id, title: groupName.get(c.group_id ?? "") ?? "Circle", emoji: "👥" };
      }
      const otherId = (allParts ?? []).find((p) => p.chat_id === c.id && p.user_id !== profile.id)?.user_id;
      return { id: c.id, title: nameById.get(otherId ?? "") ?? "Chat", emoji: "💬" };
    });
  }

  return (
    <div>
      <div className="screen-title">Messages</div>
      <div className="screen-sub">Your direct and circle chats.</div>
      {rows.length === 0 && <div className="empty">No chats yet. Give a friend a quest to start one!</div>}
      {rows.map((r) => (
        <Link key={r.id} href={`/app/chat/${r.id}`} className="quest" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>{r.emoji}</div>
            <div style={{ flex: 1, fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16 }}>{r.title}</div>
            <div style={{ color: "var(--muted)", fontSize: 20 }}>›</div>
          </div>
        </Link>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}
