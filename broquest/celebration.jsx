/* global React, Avatar */
// ===========================================================
// BroQuest — Celebration overlay + gesture definitions
// ===========================================================
const { useState, useEffect, useMemo } = React;

const GESTURES = [
  { id: "wave",      label: "Wave",             emoji: "👋", hand: "fist", minBond: 1, desc: "A friendly hello" },
  { id: "fist",      label: "Fist Bump",        emoji: "👊", hand: "fist", minBond: 2, desc: "Classic respect" },
  { id: "high5",     label: "High Five",        emoji: "🙌", hand: "palm", minBond: 3, desc: "Up top!" },
  { id: "brohug",    label: "Bro Hug",          emoji: "🤗", hand: "palm", minBond: 4, desc: "Come here, you" },
  { id: "handshake", label: "Secret Handshake", emoji: "🤝", hand: "palm", minBond: 5, desc: "Only the realest know it" },
];
const gestureById = (id) => GESTURES.find((g) => g.id === id) || GESTURES[0];

const CONFETTI_COLORS = ["#ff5252", "#ffd23d", "#33c46a", "#3aa0ff", "#b56bff", "#ff7ac0"];
const HYPE = ["LEGEND!", "FIRE!", "EPIC!", "NICE ONE!", "GOATED!"];

function Flames() {
  const flames = [
    { w: 26, h: 70, x: -74, d: 0.0 },
    { w: 40, h: 104, x: -44, d: 0.25 },
    { w: 64, h: 168, x: 0, d: 0.1, core: true },
    { w: 40, h: 110, x: 44, d: 0.32 },
    { w: 26, h: 74, x: 74, d: 0.15 },
    { w: 18, h: 52, x: -104, d: 0.4 },
    { w: 18, h: 56, x: 104, d: 0.2 },
  ];
  return (
    <div className="cel-fire">
      {flames.map((f, i) => (
        <div key={i} style={{ position: "relative", width: f.w, height: f.h, marginLeft: i ? -6 : 0 }}>
          <div
            className="flame"
            style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: f.w, height: f.h, animationDelay: `${f.d}s` }}
          />
          {f.core && (
            <div className="flame core" style={{ width: f.w * 0.5, height: f.h * 0.6, animationDelay: `${f.d + 0.2}s` }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Celebration({ active, data, onClose }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1720),
    ];
    return () => t.forEach(clearTimeout);
  }, [active, data && data.nonce]);

  const confetti = useMemo(() => {
    return Array.from({ length: 46 }, (_, i) => ({
      left: Math.random() * 100,
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 12,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dur: 1.1 + Math.random() * 1.1,
      delay: Math.random() * 0.5,
      round: Math.random() > 0.6,
    }));
  }, [data && data.nonce]);

  const sparks = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      left: 30 + Math.random() * 40,
      color: Math.random() > 0.5 ? "#ffd23d" : "#ff8a00",
      dur: 0.9 + Math.random() * 0.7,
      delay: Math.random() * 0.4,
      size: 5 + Math.random() * 5,
    }));
  }, [data && data.nonce]);

  if (!active || !data) return null;
  const g = gestureById(data.gesture);
  const you = data.you;
  const friend = data.friend;

  return (
    <div className={`celebrate p${phase}`}>
      <div className="cel-flash" />
      <div className="cel-rays" />

      {confetti.map((c, i) => (
        <span key={i} className="conf" style={{
          left: `${c.left}%`, width: c.w, height: c.h, background: c.color,
          borderRadius: c.round ? "50%" : 2,
          animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`,
        }} />
      ))}

      <div className="cel-head">
        <div className="cel-kicker">Quest Complete</div>
        <h1 className="cel-title">{data.hype}</h1>
        <div className="cel-gesture-name"><span style={{ fontSize: 18 }}>{g.emoji}</span> {g.label}</div>
      </div>

      <div className="cel-stage">
        <Flames />
        {sparks.map((s, i) => (
          <span key={i} className="spark" style={{
            left: `${s.left}%`, width: s.size, height: s.size, background: s.color,
            animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`,
          }} />
        ))}
        <div className="cel-pair">
          <div className="cel-toon left">
            <Avatar look={you} size={94} />
            <div className="nmtag">You</div>
          </div>
          <div className="cel-toon right">
            <Avatar look={friend.look} size={94} />
            <div className="nmtag">{friend.name}</div>
          </div>
          <div className={`cel-hand ${g.hand} l`} style={{ "--hand": you.skin }} />
          <div className={`cel-hand ${g.hand} r`} style={{ "--hand": friend.look.skin }} />
          <div className="cel-impact">{g.emoji}</div>
        </div>
      </div>

      <div className="cel-foot">
        <div className="cel-rewards">
          <div className="cel-rw coins">
            <div className="big"><span className="coin-pop">🪙</span> +{data.coins}</div>
            <div className="lab">Coins earned</div>
          </div>
          <div className="cel-rw bond">
            <div className="big">+{data.bondGain} ❤</div>
            <div className="lab">Bond · {friend.name}</div>
          </div>
        </div>
        <div className="cel-tap">{phase >= 3 ? "tap below to keep questing" : "\u00A0"}</div>
        <button className="btn btn-primary cel-continue" onClick={onClose}>Awesome!</button>
      </div>
    </div>
  );
}

Object.assign(window, { Celebration, GESTURES, gestureById, HYPE });
