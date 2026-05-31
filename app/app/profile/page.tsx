// BroQuest — profile: avatar, nickname, flame, stats, equipped cosmetics
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/queries";
import { signout } from "@/app/auth/actions";
import Avatar from "@/components/broquest/Avatar";

const FLAME_EMOJI: Record<string, string> = { blue: "🔵🔥", rainbow: "🌈🔥", crown: "👑🔥" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: given }, { count: completed }, shop] = await Promise.all([
    supabase.from("quests").select("*", { count: "exact", head: true }).eq("giver_id", profile.id),
    supabase
      .from("quests")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", profile.id)
      .eq("status", "completed"),
    getShop(profile.id),
  ]);

  const equippedFlame = shop.find((c) => c.category === "flame_decoration" && c.equipped);
  const owned = shop.filter((c) => c.owned);

  const stat = (label: string, value: number | string, emoji: string) => (
    <div style={{ flex: 1, background: "var(--tile)", borderRadius: 16, padding: "12px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 20 }}>{value}</div>
      <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 11.5 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="screen-title">Profile</div>

      <div style={{ textAlign: "center", padding: "8px 16px 4px" }}>
        <div style={{ display: "inline-block", position: "relative" }}>
          <Avatar look={profile.avatar_look} size={120} />
        </div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 24, marginTop: 10, color: profile.nickname_color }}>
          {profile.nickname || profile.display_name}
        </div>
        <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 13 }}>{profile.email}</div>
      </div>

      {/* flame */}
      <div style={{ margin: "10px 16px", background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 38 }}>{equippedFlame ? FLAME_EMOJI[equippedFlame.asset_ref] ?? "🔥" : "🔥"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18 }}>{profile.streak_count}-day streak</div>
          <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 13 }}>
            {equippedFlame ? equippedFlame.name : "Complete a quest daily to feed the flame"}
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "flex", gap: 10, padding: "0 16px 6px" }}>
        {stat("Coins", profile.coin_balance, "🪙")}
        {stat("Completed", completed ?? 0, "✅")}
        {stat("Given", given ?? 0, "🎯")}
      </div>

      {/* inventory */}
      <div className="section-h"><h2>Inventory</h2><span className="count">{owned.length}</span></div>
      <div style={{ padding: "0 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {owned.length === 0 && <div className="empty" style={{ width: "100%" }}>Nothing yet — visit the Shop!</div>}
        {owned.map((c) => (
          <span
            key={c.id}
            className="gtag on"
            style={{ opacity: c.equipped ? 1 : 0.6 }}
          >
            {c.equipped ? "✓ " : ""}{c.name}
          </span>
        ))}
      </div>

      <div style={{ padding: "18px 16px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Link className="btn btn-ghost" href="/app/groups" style={{ textAlign: "center" }}>👥 My circles</Link>
        <Link className="btn btn-ghost" href="/app/chat" style={{ textAlign: "center" }}>💬 Messages</Link>
        <Link className="btn btn-ghost" href="/app/quests" style={{ textAlign: "center" }}>📜 All my quests</Link>
        <form action={signout}>
          <button className="btn btn-ghost" type="submit" style={{ width: "100%", color: "#e23b50" }}>Log out</button>
        </form>
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}
