/* global React */
// ===========================================================
// BroQuest — Avatar component + presets
// ===========================================================

// hair: short | swoop | curls | buzz | bun
// acc:  none | glasses | cap
function Avatar({ look, size = 56, smiley = true, style }) {
  const { skin, hair, hairColor, acc = "none", capColor } = look;
  const hasBack = hair === "long" || hair === "curls" || hair === "bun";
  const backClass = hair === "curls" ? "back-curls" : "back-long";
  const fringeClass =
    hair === "swoop" ? "fringe-swoop" :
    hair === "curls" ? "fringe-curls" :
    hair === "buzz"  ? "fringe-buzz"  : "fringe-short";

  return (
    <div
      className={"av" + (smiley ? " smiley" : "")}
      style={{ width: size, height: size, "--skin": skin, ...style }}
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

// ---- character roster ----
const LOOKS = {
  you:  { skin: "#f1c89f", hair: "short", hairColor: "#3a2b1f", acc: "none" },
  theo: { skin: "#cd9f74", hair: "curls", hairColor: "#1d1a18", acc: "glasses" },
  maya: { skin: "#e8b489", hair: "long",  hairColor: "#5a2a17", acc: "none" },
  sana: { skin: "#d79f68", hair: "bun",   hairColor: "#241712", acc: "none" },
  leo:  { skin: "#f0c096", hair: "buzz",  hairColor: "#211d1a", acc: "cap", capColor: "#2f6df0" },
  cole: { skin: "#b9835c", hair: "swoop", hairColor: "#2a2018", acc: "none" },
};

window.Avatar = Avatar;
window.LOOKS = LOOKS;
