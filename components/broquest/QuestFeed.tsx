"use client";
// BroQuest — home quest feed with complete → celebration flow (real data)
import { useState } from "react";
import Avatar from "./Avatar";
import Celebration from "./Celebration";
import { catById, gestureById, HYPE, rand } from "./data";
import type { CelebrationData } from "./types";
import { completeQuest } from "@/app/actions/quests";
import type { AvatarLook } from "@/lib/db/types";

export interface FeedQuest {
  id: string;
  description: string;
  reward: number;
  gesture: string;
  category: string;
  status: string;
  fromName: string;
  fromLook: AvatarLook;
}

export default function QuestFeed({
  initialQuests,
  myLook,
}: {
  initialQuests: FeedQuest[];
  myLook: AvatarLook;
}) {
  const [quests, setQuests] = useState<FeedQuest[]>(initialQuests);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const active = quests.filter((q) => q.status !== "completed");
  const done = quests.filter((q) => q.status === "completed");
  const total = quests.length;

  async function onComplete(q: FeedQuest) {
    if (busy) return;
    setBusy(q.id);
    const res = await completeQuest(q.id);
    setBusy(null);
    if (!res.ok) {
      setToast(res.error ?? "Something went wrong");
      setTimeout(() => setToast(""), 2200);
      return;
    }
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, status: "completed" } : x)));
    setCelebration({
      you: myLook,
      friend: { id: "f", name: q.fromName, look: q.fromLook },
      gesture: q.gesture,
      coins: res.data?.rewardCoins ?? q.reward,
      bondGain: 15,
      hype: rand(HYPE),
      questText: q.description,
      nonce: Date.now(),
    });
  }

  function closeCelebration() {
    const c = celebration;
    setCelebration(null);
    if (c) {
      setToast(`+${c.coins} coins · +${c.bondGain} bond ❤`);
      setTimeout(() => setToast(""), 2200);
    }
  }

  return (
    <div>
      <div className="section-h" style={{ marginTop: 4 }}>
        <h2>Today&apos;s Quests</h2>
        <span className="count">FROM YOUR CREW</span>
      </div>

      {total > 0 && (
        <div style={{ margin: "2px 16px 8px", background: "var(--tile)", borderRadius: 18, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14 }}>
              {done.length}/{total} quests done today
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "var(--surface)", marginTop: 7, overflow: "hidden" }}>
              <i style={{ display: "block", height: "100%", width: `${total ? (done.length / total) * 100 : 0}%`, background: "var(--primary)", borderRadius: 999, transition: "width .5s" }} />
            </div>
          </div>
        </div>
      )}

      {active.length === 0 && (
        <div className="empty">
          {total === 0 ? (
            <>No quests yet.<br />Tap ✦ to dare a friend!</>
          ) : (
            <>All done. You&apos;re on fire today 🔥<br />Go give someone else a quest!</>
          )}
        </div>
      )}

      {active.map((q) => {
        const g = gestureById(q.gesture);
        return (
          <div className="quest" key={q.id}>
            <div className="q-top">
              <div className="q-icon">{catById(q.category).em}</div>
              <div className="q-meta">
                <div className="q-from">
                  <Avatar look={q.fromLook} size={18} smiley={false} /> from <b>{q.fromName}</b>
                </div>
                <div className="q-text">{q.description}</div>
              </div>
              <div className="q-reward">
                <span className="c">+{q.reward}</span>coins
              </div>
            </div>
            <div className="q-foot">
              <span className="q-gesture">
                <span className="ge">{g.emoji}</span>
                {g.label} on win
              </span>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: "auto" }}
                disabled={busy === q.id}
                onClick={() => onComplete(q)}
              >
                {busy === q.id ? "…" : "Done! ✓"}
              </button>
            </div>
          </div>
        );
      })}

      {done.length > 0 && (
        <>
          <div className="section-h">
            <h2>Crushed it</h2>
            <span className="count">{done.length}</span>
          </div>
          {done.map((q) => (
            <div className="quest" key={q.id} style={{ opacity: 0.6 }}>
              <div className="q-top">
                <div className="q-icon" style={{ background: "var(--primary)", color: "var(--primary-ink)" }}>✓</div>
                <div className="q-meta">
                  <div className="q-from">from <b>{q.fromName}</b></div>
                  <div className="q-text" style={{ textDecoration: "line-through" }}>{q.description}</div>
                </div>
                <div className="q-reward" style={{ color: "var(--muted)" }}>+{q.reward}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ height: 8 }} />
      {toast && <div className="toast show">{toast}</div>}
      <Celebration key={celebration?.nonce ?? "idle"} active={!!celebration} data={celebration} onClose={closeCelebration} />
    </div>
  );
}
