"use client";
// BroQuest — optional proof photo for a quest + AI review.
// Fully optional & non-blocking: pick a photo → it's downscaled in-browser →
// sent to /api/quests/proof → an AI verdict comes back. Any failure just shows
// a soft message; it never blocks completing the quest.
import { useRef, useState } from "react";
import type { ProofReview } from "@/lib/db/types";

function scoreEmoji(score: number): string {
  if (score >= 85) return "🏆";
  if (score >= 65) return "🔥";
  if (score >= 40) return "👍";
  return "🤔";
}

// Downscale + re-encode a picked image to a small JPEG data URL, so uploads
// stay tiny and the AI call stays cheap/fast.
function downscale(file: File, max = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width >= height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

export default function QuestProof({
  questId,
  initialImageUrl,
  initialReview,
  onReviewed,
  canAdd = true,
}: {
  questId: string;
  initialImageUrl?: string | null;
  initialReview?: ProofReview | null;
  onReviewed?: (review: ProofReview) => void;
  /** When false, the photo is shown read-only (e.g. the giver's view). */
  canAdd?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl ?? null);
  const [review, setReview] = useState<ProofReview | null>(initialReview ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || busy) return;
    setError("");
    setBusy(true);
    try {
      const dataUrl = await downscale(file);
      setPreview(dataUrl);
      const res = await fetch("/api/quests/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, imageBase64: dataUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.review) throw new Error(json?.error ?? "review failed");
      if (json.imageUrl) setPreview(json.imageUrl);
      setReview(json.review as ProofReview);
      onReviewed?.(json.review as ProofReview);
    } catch {
      // Soft fail: keep the local preview, tell them it didn't review.
      setError("Couldn't reach the AI judge — photo still attached. You can still complete!");
    } finally {
      setBusy(false);
    }
  }

  // Giver's view with nothing submitted yet — render nothing.
  if (!canAdd && !preview) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        style={{ display: "none" }}
      />

      {!preview && !busy && canAdd && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
        >
          📸 Add proof photo
        </button>
      )}

      {preview && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Quest proof"
            style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 14, border: "2px solid var(--border)", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {busy && (
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--muted)" }}>
                🤖 AI judge is looking…
              </div>
            )}
            {review && !busy && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15 }}>
                  <span style={{ fontSize: 20 }}>{scoreEmoji(review.score)}</span>
                  <span>{review.verdict}</span>
                  <span style={{ marginLeft: "auto", background: review.passed ? "var(--primary)" : "var(--tile)", color: review.passed ? "var(--primary-ink)" : "var(--muted)", borderRadius: 999, padding: "2px 10px", fontSize: 12.5 }}>
                    {review.score}/100
                  </span>
                </div>
                {review.feedback && (
                  <div style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                    {review.feedback}
                  </div>
                )}
              </div>
            )}
            {!review && !busy && canAdd && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
                Retake photo
              </button>
            )}
          </div>
        </div>
      )}

      {error && <div style={{ color: "#e23b50", fontWeight: 700, fontSize: 12.5, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
