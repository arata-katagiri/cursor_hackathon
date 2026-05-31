// BroQuest — Give a quest (3-step flow). Footer pinned by the app shell.
import Avatar from "./Avatar";
import { CATEGORIES, DIFFS, GESTURES } from "./data";
import type { Friend, GiveState } from "./types";

interface GiveScreenProps {
  friends: Friend[];
  give: GiveState;
  set: (patch: Partial<GiveState>) => void;
}

export default function GiveScreen({ friends, give, set }: GiveScreenProps) {
  const { step, fid, text, cat, diff, gesture } = give;
  const friend = friends.find((f) => f.id === fid);

  return (
    <div>
      <div className="screen-title">Give a Quest</div>
      <div className="screen-sub">Dare a friend to level up today.</div>

      <div style={{ display: "flex", gap: 6, padding: "0 20px 4px" }}>
        {[1, 2, 3].map((s) => (
          <i key={s} style={{ flex: 1, height: 6, borderRadius: 999, background: s <= step ? "var(--primary)" : "var(--border)", transition: "background .3s" }} />
        ))}
      </div>

      <div className="give-wrap">
        {step === 1 && (
          <>
            <div className="step-label">Step 1 · Who&apos;s it for?</div>
            <div className="friend-rail">
              {friends.map((f) => (
                <button key={f.id} className={"fr-pick" + (fid === f.id ? " sel" : "")} onClick={() => set({ fid: f.id })}>
                  <div className="ring"><Avatar look={f.look} size={58} /></div>
                  {f.name}
                  <span className="bondmini">{"❤".repeat(f.bond.level)}</span>
                </button>
              ))}
            </div>
            {friend && (
              <div style={{ marginTop: 14, background: "var(--tile)", borderRadius: 16, padding: "12px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--muted)" }}>
                You &amp; <b style={{ color: "var(--primary)" }}>{friend.name}</b> are <b style={{ color: "var(--text)" }}>Bond Lv.{friend.bond.level}</b> — that unlocks <b style={{ color: "var(--text)" }}>{friend.bond.level}</b> reward gesture{friend.bond.level > 1 ? "s" : ""}.
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="step-label">Step 2 · The challenge</div>
            <textarea className="qinput" rows={3} placeholder="e.g. Do 30 push-ups before lunch 💪" value={text} onChange={(e) => set({ text: e.target.value })} />
            <div className="step-label" style={{ marginTop: 18 }}>Category</div>
            <div className="chip-grid">
              {CATEGORIES.map((c) => (
                <button key={c.id} className={"chip" + (cat === c.id ? " sel" : "")} onClick={() => set({ cat: c.id })}>
                  <span className="em">{c.em}</span>{c.label}
                </button>
              ))}
            </div>
            <div className="step-label" style={{ marginTop: 18 }}>Difficulty &amp; reward</div>
            <div className="diff-row">
              {DIFFS.map((d) => (
                <button key={d.id} className={"diff" + (diff === d.id ? " sel" : "")} onClick={() => set({ diff: d.id })}>
                  <div className="dn">{d.label}</div>
                  <div className="dc">🪙 {d.coins}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && friend && (
          <>
            <div className="step-label">Step 3 · Pick the win gesture</div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, margin: "-2px 2px 12px" }}>
              When {friend.name} wins, your avatars do this together. Deeper bonds unlock bigger moves.
            </div>
            <div className="gest-list">
              {GESTURES.map((g) => {
                const locked = g.minBond > friend.bond.level;
                return (
                  <button key={g.id} className={"gest" + (gesture === g.id ? " sel" : "")} disabled={locked} onClick={() => set({ gesture: g.id })}>
                    <span className="gbubble">{g.emoji}</span>
                    <span>
                      <div className="gname">{g.label}</div>
                      <div className="gdesc">{g.desc}</div>
                    </span>
                    {locked
                      ? <span className="glock">🔒<br />Bond <b>Lv.{g.minBond}</b></span>
                      : <span className="glock" style={{ color: "var(--primary)" }}>{gesture === g.id ? "✓" : ""}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div style={{ height: 96 }} />
    </div>
  );
}
