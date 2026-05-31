"use client";
// BroQuest — group quest round: start a round, show the derangement, dare your target
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startRound, leaveGroup } from "@/app/actions/groups";

export interface RoundMember {
  id: string;
  name: string;
}
export interface ActiveRound {
  id: string;
  assignments: { giver: string; receiver: string }[];
}

export default function RoundPanel({
  groupId,
  myId,
  members,
  round,
}: {
  groupId: string;
  myId: string;
  members: RoundMember[];
  round: ActiveRound | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";

  async function start() {
    setBusy(true);
    const res = await startRound(groupId);
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function leave() {
    if (busy) return;
    setBusy(true);
    await leaveGroup(groupId);
    setBusy(false);
    router.push("/app/groups");
  }

  const myTarget = round?.assignments.find((a) => a.giver === myId)?.receiver ?? null;

  return (
    <div>
      <div className="section-h"><h2>Quest round</h2></div>

      {!round && (
        <div className="empty">
          No active round.<br />Start one to randomly assign everyone a target!
        </div>
      )}

      {round && (
        <>
          {myTarget && (
            <div style={{ margin: "0 16px 12px", background: "var(--tile)", borderRadius: 18, padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16 }}>
                🎯 You dare <span style={{ color: "var(--primary)" }}>{nameOf(myTarget)}</span>
              </div>
              <Link
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 10, textAlign: "center" }}
                href={`/app/give?to=${myTarget}&round=${round.id}`}
              >
                Author their quest ✦
              </Link>
            </div>
          )}
          <div style={{ padding: "0 16px" }}>
            {round.assignments.map((a) => (
              <div
                key={a.giver}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 8,
                  background: a.giver === myId ? "var(--tile)" : "var(--surface)",
                  border: "2px solid var(--border)", borderRadius: 14, fontWeight: 800,
                }}
              >
                <span>{nameOf(a.giver)}</span>
                <span style={{ color: "var(--primary)" }}>→</span>
                <span>{nameOf(a.receiver)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-primary" disabled={busy} onClick={start}>
          {busy ? "…" : round ? "Re-roll round 🎲" : "Start round 🎲"}
        </button>
        <button className="btn btn-ghost" disabled={busy} onClick={leave} style={{ color: "#e23b50" }}>
          Leave circle
        </button>
      </div>
    </div>
  );
}
