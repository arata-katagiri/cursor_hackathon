/* global React, Avatar, GESTURES, gestureById */
// ===========================================================
// BroQuest — screens: Home, Give, Friends
// ===========================================================
const { useState: useStateS } = React;

const CATEGORIES = [
  { id: "fitness", em: "💪", label: "Move" },
  { id: "social",  em: "🎉", label: "Social" },
  { id: "mind",    em: "🧠", label: "Mind" },
  { id: "create",  em: "🎨", label: "Create" },
  { id: "food",    em: "🥗", label: "Food" },
  { id: "dare",    em: "😈", label: "Dare" },
];
const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

const DIFFS = [
  { id: "chill", label: "Chill", coins: 20 },
  { id: "solid", label: "Solid", coins: 50 },
  { id: "beast", label: "Beast", coins: 100 },
];

// ---------- HOME ----------
function HomeScreen({ state, friendsById, onComplete }) {
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

      <div className="section-h"><h2>Today's Quests</h2><span className="count">FROM YOUR CREW</span></div>
      {active.length === 0 && <div className="empty">All done. You're on fire today 🔥<br />Go give someone else a quest!</div>}
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
              <div className="quest" key={q.id} style={{ opacity: .6 }}>
                <div className="q-top">
                  <div className="q-icon" style={{ background: "var(--primary)", color: "var(--primary-ink)" }}>✓</div>
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

// ---------- GIVE (controlled by PhoneApp so footer can pin to frame) ----------
function GiveScreen({ friends, give, set }) {
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
            <div className="step-label">Step 1 · Who's it for?</div>
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
                You & <b style={{ color: "var(--primary)" }}>{friend.name}</b> are <b style={{ color: "var(--text)" }}>Bond Lv.{friend.bond.level}</b> — that unlocks <b style={{ color: "var(--text)" }}>{friend.bond.level}</b> reward gesture{friend.bond.level > 1 ? "s" : ""}.
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

// ---------- FRIENDS / RELATIONSHIPS ----------
function FriendsScreen({ friends, onCheer, onGive }) {
  return (
    <div>
      <div className="screen-title">Your Crew</div>
      <div className="screen-sub">Cheer each other on. Deeper bonds = bigger win gestures.</div>
      <div style={{ height: 6 }} />
      {friends.map((f) => {
        const pct = Math.round((f.bond.xp / f.bond.xpMax) * 100);
        return (
          <div className="bond-card" key={f.id}>
            <div className="bond-top">
              <Avatar look={f.look} size={54} />
              <div>
                <div className="bond-name">{f.name}</div>
                <div className="bond-lvl">Bond Lv.{f.bond.level} · {f.title}</div>
              </div>
              <div className="bond-hearts">{Array.from({ length: 5 }, (_, i) => (
                <span key={i} style={{ opacity: i < f.bond.level ? 1 : .22 }}>❤️</span>
              ))}</div>
            </div>
            <div className="bond-bar"><i style={{ width: `${pct}%` }} /></div>
            <div className="bond-xp">{f.bond.xp} / {f.bond.xpMax} XP to Lv.{f.bond.level + 1}</div>
            <div className="bond-gestures">
              {GESTURES.map((g) => (
                <span key={g.id} className={"gtag" + (g.minBond <= f.bond.level ? " on" : "")}>
                  {g.minBond <= f.bond.level ? g.emoji : "🔒"} {g.label}
                </span>
              ))}
            </div>
            <div className="bond-actions">
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, width: "auto" }} onClick={(e) => onCheer(f, e)}>💛 Cheer on</button>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, width: "auto" }} onClick={() => onGive(f)}>Send quest</button>
            </div>
          </div>
        );
      })}
      <div style={{ height: 8 }} />
    </div>
  );
}

Object.assign(window, { HomeScreen, GiveScreen, FriendsScreen, CATEGORIES, catById, DIFFS });
