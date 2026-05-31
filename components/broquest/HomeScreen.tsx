// BroQuest — Home: today's quests feed
import type { CSSProperties } from "react";
import Avatar from "./Avatar";
import { catById, gestureById } from "./data";
import type { Friend, Quest } from "./types";

interface HomeScreenProps {
  state: { coins: number; streak: number; quests: Quest[]; dateLabel: string };
  friendsById: Record<string, Friend>;
  onComplete: (q: Quest) => void;
}

export default function HomeScreen({ state, friendsById, onComplete }: HomeScreenProps) {
  const active = state.quests.filter((q) => q.status === "active");
  const done = state.quests.filter((q) => q.status === "done");
  const total = state.quests.length;
  const doneCount = done.length;

  return (
    <div>
      <div className="topbar">
        <div className="greet">Hey, you 👋<small>{state.dateLabel}</small></div>
        <div className="stat-pills">
          <span className="pill streak"><span className="glyph">🔥</span>{state.streak}</span>
          <span className="pill coins"><span className="glyph">🪙</span>{state.coins}</span>
        </div>
      </div>

      <div style={{ margin: "8px 16px 4px", background: "var(--tile)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 30 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15 }}>
            {doneCount}/{total} quests done today
          </div>
          <div style={{ height: 9, borderRadius: 999, background: "var(--surface)", marginTop: 7, overflow: "hidden" }}>
            <i style={{ display: "block", height: "100%", width: `${total ? (doneCount / total) * 100 : 0}%`, background: "var(--primary)", borderRadius: 999, transition: "width .5s" }} />
          </div>
        </div>
      </div>

      <div className="section-h"><h2>Today&apos;s Quests</h2><span className="count">FROM YOUR CREW</span></div>
      {active.length === 0 && <div className="empty">All done. You&apos;re on fire today 🔥<br />Go give someone else a quest!</div>}
      {active.map((q) => {
        const f = friendsById[q.fromId];
        const g = gestureById(q.gesture);
        return (
          <div className="quest" key={q.id}>
            <div className="q-top">
              <div className="q-icon">{catById(q.category).em}</div>
              <div className="q-meta">
                <div className="q-from"><Avatar look={f.look} size={18} smiley={false} /> from <b>{f.name}</b></div>
                <div className="q-text">{q.text}</div>
              </div>
              <div className="q-reward"><span className="c">+{q.reward}</span>coins</div>
            </div>
            <div className="q-foot">
              <span className="q-gesture"><span className="ge">{g.emoji}</span>{g.label} on win</span>
              <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => onComplete(q)}>Done! ✓</button>
            </div>
          </div>
        );
      })}

      {done.length > 0 && (
        <>
          <div className="section-h"><h2>Crushed it</h2><span className="count">{done.length}</span></div>
          {done.map((q) => {
            const f = friendsById[q.fromId];
            return (
              <div className="quest" key={q.id} style={{ opacity: 0.6 }}>
                <div className="q-top">
                  <div className="q-icon" style={{ background: "var(--primary)", color: "var(--primary-ink)" } as CSSProperties}>✓</div>
                  <div className="q-meta">
                    <div className="q-from">from <b>{f.name}</b></div>
                    <div className="q-text" style={{ textDecoration: "line-through" }}>{q.text}</div>
                  </div>
                  <div className="q-reward" style={{ color: "var(--muted)" }}>+{q.reward}</div>
                </div>
              </div>
            );
          })}
        </>
      )}
      <div style={{ height: 8 }} />
    </div>
  );
}
