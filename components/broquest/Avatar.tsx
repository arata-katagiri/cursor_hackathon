// BroQuest — Avatar composed from CSS primitives (scales with `size`)
import type { CSSProperties } from "react";
import type { Look } from "./types";

interface AvatarProps {
  look: Look;
  size?: number;
  smiley?: boolean;
  style?: CSSProperties;
}

export default function Avatar({ look, size = 56, smiley = true, style }: AvatarProps) {
  const { skin, hair, hairColor, acc = "none", capColor } = look;
  const hasBack = hair === "long" || hair === "curls" || hair === "bun";
  const backClass = hair === "curls" ? "back-curls" : "back-long";
  const fringeClass =
    hair === "swoop" ? "fringe-swoop" :
    hair === "curls" ? "fringe-curls" :
    hair === "buzz" ? "fringe-buzz" : "fringe-short";

  return (
    <div
      className={"av" + (smiley ? " smiley" : "")}
      style={{ width: size, height: size, "--skin": skin, ...style } as CSSProperties}
    >
      {hasBack && hair !== "bun" && (
        <div className={"av-back " + backClass} style={{ background: hairColor }} />
      )}
      {hair === "bun" && <div className="av-bun" style={{ background: hairColor }} />}
      <div className="av-skin" />
      {acc !== "cap" && (
        <div className={"av-fringe " + fringeClass} style={{ background: hairColor }} />
      )}
      <div className="av-eyes"><span /><span /></div>
      <div className="av-mouth" />
      <div className="av-blush"><i /><i /></div>
      {acc === "glasses" && (
        <div className="av-glasses"><i /><span className="bridge" /><i /></div>
      )}
      {acc === "cap" && (
        <div className="av-cap" style={{ background: capColor || "#e23b50" }} />
      )}
      <div className="av-ring" />
    </div>
  );
}
