"use client";
// BroQuest — give-a-quest flow with 3 authoring modes (manual / AI-assist / AI-full)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { CATEGORIES, DIFFS, GESTURES } from "./data";
import type { AuthorMode, AvatarLook } from "@/lib/db/types";
import { createQuest } from "@/app/actions/quests";

export interface GiveFriend {
  id: string;
  name: string;
  look: AvatarLook;
  bondLevel: number;
}

type Mode = AuthorMode; // manual | ai_assisted | ai_full

export default function GiveFlow({
  friends,
  initialFid = null,
  roundId = null,
}: {
  friends: GiveFriend[];
  initialFid?: string | null;
  roundId?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fid, setFid] = useState<string | null>(initialFid ?? friends[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>("manual");
  const [seed, setSeed] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [cat, setCat] = useState("fitness");
  const [diff, setDiff] = useState("solid");
  const [gesture, setGesture] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const friend = friends.find((f) => f.id === fid) ?? null;
  const coins = DIFFS.find((d) => d.id === diff)?.coins ?? 50;

  const canNext =
    step === 1 ? !!fid : step === 2 ? text.trim().length > 2 : !!gesture;

  async function generate() {
    if (!friend) return;
    if (mode === "ai_assisted" && !seed.trim()) {
      setAiError("Type a quick idea first.");
      return;
    }
    setAiError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/quests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          receiverId: friend.id,
          receiverName: friend.name,
          seed: seed.trim() || undefined,
          difficulty: diff,
          category: cat,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI failed");
      setTitle(json.quest.title ?? "");
      setText(json.quest.description ?? "");
      if (json.quest.category) setCat(json.quest.category);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!friend || sending) return;
    setSending(true);
    const res = await createQuest({
      receiverId: friend.id,
      title: title.trim() || text.trim().slice(0, 60),
      description: text.trim(),
      rewardCoins: coins,
      proofRequired: diff === "beast",
      authorMode: mode,
      category: cat,
      gesture: gesture ?? "fist",
      roundId: roundId ?? undefined,
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      setAiError(res.error ?? "Could not send");
    }
  }

  if (friends.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        No friends yet.<br />Add some in the Crew tab first!
      </div>
    );
  }

  if (sent && friend) {
    return (
      <div className="sent-wrap">
        <div className="sent-emoji">🚀</div>
        <div className="sent-h">Quest sent!</div>
        <div className="sent-p">
          <b>{friend.name}</b> just got dared:<br />
          <span style={{ color: "var(--text)", fontWeight: 800 }}>“{text.trim()}”</span>
        </div>
        <div style={{ margin: "18px 0 22px" }}><Avatar look={friend.look} size={84} /></div>
        <button className="btn btn-primary" style={{ maxWidth: 240 }} onClick={() => router.push("/app")}>
          Back home
        </button>
      </div>
    );
  }

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
                <button key={f.id} className={"fr-pick" + (fid === f.id ? " sel" : "")} onClick={() => setFid(f.id)}>
                  <div className="ring"><Avatar look={f.look} size={58} /></div>
                  {f.name}
                  <span className="bondmini">{"❤".repeat(Math.max(1, f.bondLevel))}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="step-label">Step 2 · The challenge</div>

            {/* mode selector */}
            <div className="diff-row" style={{ marginBottom: 14 }}>
              {([
                { id: "manual", label: "✍️ Write" },
                { id: "ai_assisted", label: "✨ AI assist" },
                { id: "ai_full", label: "🎲 Surprise" },
              ] as const).map((m) => (
                <button key={m.id} className={"diff" + (mode === m.id ? " sel" : "")} onClick={() => setMode(m.id)}>
                  <div className="dn" style={{ fontSize: 13 }}>{m.label}</div>
                </button>
              ))}
            </div>

            {mode === "ai_assisted" && (
              <input
                className="qinput"
                style={{ marginBottom: 10 }}
                placeholder="Your idea, e.g. 'something with coffee'"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            )}

            {mode !== "manual" && (
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginBottom: 12 }} disabled={generating} onClick={generate}>
                {generating ? "Thinking… ✨" : mode === "ai_full" ? "Surprise me ✨" : "Generate quest ✨"}
              </button>
            )}

            <textarea
              className="qinput"
              rows={3}
              placeholder="e.g. Do 30 push-ups before lunch 💪"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {aiError && <div style={{ color: "#e23b50", fontWeight: 700, fontSize: 13, marginTop: 6 }}>{aiError}</div>}

            <div className="step-label" style={{ marginTop: 18 }}>Category</div>
            <div className="chip-grid">
              {CATEGORIES.map((c) => (
                <button key={c.id} className={"chip" + (cat === c.id ? " sel" : "")} onClick={() => setCat(c.id)}>
                  <span className="em">{c.em}</span>{c.label}
                </button>
              ))}
            </div>

            <div className="step-label" style={{ marginTop: 18 }}>Difficulty &amp; reward</div>
            <div className="diff-row">
              {DIFFS.map((d) => (
                <button key={d.id} className={"diff" + (diff === d.id ? " sel" : "")} onClick={() => setDiff(d.id)}>
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
                const locked = g.minBond > friend.bondLevel;
                return (
                  <button key={g.id} className={"gest" + (gesture === g.id ? " sel" : "")} disabled={locked} onClick={() => setGesture(g.id)}>
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

        {/* inline action row (kept above the bottom nav by content padding) */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            className="btn btn-ghost"
            style={{ width: 110 }}
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/app"))}
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={!canNext || sending}
            onClick={() => (step < 3 ? setStep(step + 1) : send())}
          >
            {step < 3 ? "Continue" : sending ? "Sending…" : "Send quest ✦"}
          </button>
        </div>
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
