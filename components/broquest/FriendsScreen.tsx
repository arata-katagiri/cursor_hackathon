// BroQuest — Crew / relationships: bonds, cheer, send quest
import type { MouseEvent } from "react";
import Avatar from "./Avatar";
import { GESTURES } from "./data";
import type { Friend } from "./types";

interface FriendsScreenProps {
  friends: Friend[];
  onCheer: (f: Friend, e: MouseEvent<HTMLButtonElement>) => void;
  onGive: (f: Friend) => void;
}

export default function FriendsScreen({ friends, onCheer, onGive }: FriendsScreenProps) {
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
                <span key={i} style={{ opacity: i < f.bond.level ? 1 : 0.22 }}>❤️</span>
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
