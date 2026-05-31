"use client";
// BroQuest — create & list friend circles (groups)
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import type { AvatarLook } from "@/lib/db/types";
import { createGroup } from "@/app/actions/groups";

export interface PickFriend {
  id: string;
  name: string;
  look: AvatarLook;
}
export interface GroupRow {
  id: string;
  name: string;
  memberCount: number;
}

export default function GroupsManager({
  groups,
  friends,
}: {
  groups: GroupRow[];
  friends: PickFriend[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await createGroup(name.trim(), selected);
    setBusy(false);
    if (res.ok && res.data) {
      router.push(`/app/groups/${res.data.id}`);
    } else {
      setErr(res.error ?? "Failed");
    }
  }

  return (
    <div>
      <div className="screen-title">Circles</div>
      <div className="screen-sub">Group up. Everyone dares someone each round.</div>

      <div style={{ margin: "0 16px 12px", background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 18, padding: 14 }}>
        <div className="step-label" style={{ margin: "0 0 8px" }}>New circle</div>
        <input className="qinput" placeholder="Circle name, e.g. The Squad" value={name} onChange={(e) => setName(e.target.value)} />
        {friends.length > 0 && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--muted)", margin: "12px 2px 8px" }}>Add friends</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className="fr-pick"
                  style={{ opacity: selected.includes(f.id) ? 1 : 0.55 }}
                >
                  <div className="ring" style={{ borderColor: selected.includes(f.id) ? "var(--primary)" : "var(--border)" }}>
                    <Avatar look={f.look} size={48} />
                  </div>
                  {f.name}
                </button>
              ))}
            </div>
          </>
        )}
        {err && <div style={{ color: "#e23b50", fontWeight: 700, fontSize: 13, marginTop: 8 }}>{err}</div>}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={create}>
          {busy ? "Creating…" : "Create circle ✦"}
        </button>
      </div>

      <div className="section-h"><h2>Your circles</h2><span className="count">{groups.length}</span></div>
      {groups.length === 0 && <div className="empty">No circles yet. Make one above!</div>}
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/app/groups/${g.id}`}
          className="quest"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26 }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16.5 }}>{g.name}</div>
              <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>{g.memberCount} members</div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 20 }}>›</div>
          </div>
        </Link>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}
