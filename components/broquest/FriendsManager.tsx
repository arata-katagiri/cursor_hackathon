"use client";
// BroQuest — Crew: add friends, respond to requests, view bonds
import { useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { GESTURES } from "./data";
import type { AvatarLook } from "@/lib/db/types";
import { respondToRequest, sendFriendRequest } from "@/app/actions/friends";

export interface CrewMember {
  friendshipId: string;
  id: string;
  name: string;
  look: AvatarLook;
  bondLevel: number;
  bondXp: number;
  nicknameColor: string;
}

export default function FriendsManager({
  crew,
  incoming,
}: {
  crew: CrewMember[];
  incoming: CrewMember[];
}) {
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!query.trim() || busy) return;
    setBusy(true);
    const res = await sendFriendRequest(query.trim());
    setBusy(false);
    setMsg(res.ok ? "Request sent! 🚀" : res.error ?? "Failed");
    if (res.ok) setQuery("");
    setTimeout(() => setMsg(""), 2600);
  }

  async function respond(id: string, accept: boolean) {
    setBusy(true);
    await respondToRequest(id, accept);
    setBusy(false);
  }

  return (
    <div>
      <div className="screen-title">Your Crew</div>
      <div className="screen-sub">Cheer each other on. Deeper bonds = bigger win gestures.</div>

      {/* add friend */}
      <div style={{ padding: "0 16px 8px", display: "flex", gap: 8 }}>
        <input
          className="qinput"
          style={{ flex: 1 }}
          placeholder="Add by email or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn btn-primary" style={{ width: 96 }} disabled={busy} onClick={add}>
          Add
        </button>
      </div>
      {msg && <div style={{ padding: "0 18px 8px", color: "var(--primary)", fontWeight: 800, fontSize: 13.5 }}>{msg}</div>}

      {/* incoming requests */}
      {incoming.length > 0 && (
        <>
          <div className="section-h"><h2>Friend requests</h2><span className="count">{incoming.length}</span></div>
          {incoming.map((f) => (
            <div className="bond-card" key={f.friendshipId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar look={f.look} size={48} />
              <div style={{ flex: 1, fontFamily: "var(--font-head)", fontWeight: 800 }}>{f.name}</div>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => respond(f.friendshipId, false)}>Decline</button>
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => respond(f.friendshipId, true)}>Accept</button>
            </div>
          ))}
        </>
      )}

      {/* crew list */}
      <div className="section-h"><h2>Friends</h2><span className="count">{crew.length}</span></div>
      {crew.length === 0 && <div className="empty">No friends yet.<br />Add someone above to start questing!</div>}
      {crew.map((f) => {
        const pct = Math.round(((f.bondXp % 150) / 150) * 100);
        return (
          <div className="bond-card" key={f.id}>
            <div className="bond-top">
              <Avatar look={f.look} size={54} />
              <div>
                <div className="bond-name" style={{ color: f.nicknameColor }}>{f.name}</div>
                <div className="bond-lvl">Bond Lv.{f.bondLevel}</div>
              </div>
              <div className="bond-hearts">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ opacity: i < f.bondLevel ? 1 : 0.22 }}>❤️</span>
                ))}
              </div>
            </div>
            <div className="bond-bar"><i style={{ width: `${pct}%` }} /></div>
            <div className="bond-gestures">
              {GESTURES.map((g) => (
                <span key={g.id} className={"gtag" + (g.minBond <= f.bondLevel ? " on" : "")}>
                  {g.minBond <= f.bondLevel ? g.emoji : "🔒"} {g.label}
                </span>
              ))}
            </div>
            <div className="bond-actions">
              <Link className="btn btn-primary btn-sm" style={{ flex: 1, width: "auto", textAlign: "center" }} href="/app/give">
                Send quest
              </Link>
            </div>
          </div>
        );
      })}
      <div style={{ height: 8 }} />
    </div>
  );
}
