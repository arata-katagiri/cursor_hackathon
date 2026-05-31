// BroQuest — Celebration overlay (the hero moment)
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Avatar from "./Avatar";
import { CONFETTI_COLORS, gestureById } from "./data";
import type { CelebrationData } from "./types";

interface ConfPiece { left: number; w: number; h: number; color: string; dur: number; delay: number; round: boolean }
interface SparkPiece { left: number; color: string; dur: number; delay: number; size: number }

// Deterministic PRNG (mulberry32) so decoration is a pure function of the
// celebration's nonce — stable across re-renders, no impure Math.random in render.
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

interface CelebrationProps {
  active: boolean;
  data: CelebrationData | null;
  onClose: () => void;
}

export default function Celebration({ active, data, onClose }: CelebrationProps) {
  const [phase, setPhase] = useState(0);
  const nonce = data?.nonce;

  // Decoration is pure (seeded by nonce) and regenerates per celebration.
  const { confetti, sparks } = useMemo(() => {
    const rnd = seeded((nonce ?? 1) >>> 0);
    const conf: ConfPiece[] = Array.from({ length: 46 }, (_, i) => ({
      left: rnd() * 100,
      w: 6 + rnd() * 7,
      h: 9 + rnd() * 12,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dur: 1.1 + rnd() * 1.1,
      delay: rnd() * 0.5,
      round: rnd() > 0.6,
    }));
    const spk: SparkPiece[] = Array.from({ length: 12 }, () => ({
      left: 30 + rnd() * 40,
      color: rnd() > 0.5 ? "#ffd23d" : "#ff8a00",
      dur: 0.9 + rnd() * 0.7,
      delay: rnd() * 0.4,
      size: 5 + rnd() * 5,
    }));
    return { confetti: conf, sparks: spk };
  }, [nonce]);

  // Phase 0 is the initial state on each fresh mount (parent keys us by nonce),
  // so the effect only schedules the timed transitions — no sync setState here.
  useEffect(() => {
    if (!active) return;
    const t = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1720),
    ];
    return () => t.forEach(clearTimeout);
  }, [active, nonce]);

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
          <div className={`cel-hand ${g.hand} l`} style={{ "--hand": you.skin } as CSSProperties} />
          <div className={`cel-hand ${g.hand} r`} style={{ "--hand": friend.look.skin } as CSSProperties} />
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
        <div className="cel-tap">{phase >= 3 ? "tap below to keep questing" : " "}</div>
        <button className="btn btn-primary cel-continue" onClick={onClose}>Awesome!</button>
      </div>
    </div>
  );
}
