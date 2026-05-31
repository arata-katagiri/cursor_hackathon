"use client";
// BroQuest — inline complete/confirm button (no celebration; used on overview lists)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeQuest } from "@/app/actions/quests";

export default function CompleteButton({ questId, label = "Done! ✓" }: { questId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-primary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await completeQuest(questId);
        setBusy(false);
        if (res.ok) router.refresh();
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
