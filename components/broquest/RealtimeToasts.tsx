"use client";
// BroQuest — realtime mini-toast notifications.
//
// Subscribes to Supabase postgres_changes on `friendships` and `quests` tables
// via websocket. When a relevant INSERT targets the current user, a premium
// mini-toast slides in from the top with icon + message, then auto-dismisses.
// Fully guarded — a failure in realtime never breaks the page.

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface MiniToast {
  id: number;
  icon: string;
  message: string;
  accent: string; // CSS color for the left stripe
}

let nextId = 0;

export default function RealtimeToasts({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<MiniToast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (icon: string, message: string, accent: string) => {
      const id = ++nextId;
      setToasts((prev) => [...prev.slice(-4), { id, icon, message, accent }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ch: any = null;

    const start = (token?: string) => {
      if (disposed) return;
      try {
        const supabase = createClient();
        if (token) supabase.realtime.setAuth(token);

        const c = supabase.channel(`toasts-${userId}`);

        // ── New friend request (INSERT where addressee_id = me, status = pending)
        c.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "friendships",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (disposed) return;
            const row = payload.new;
            // Only show toast if I'm the addressee (someone sent me a request)
            if (row?.addressee_id === userId && row?.status === "pending") {
              pushToast("👋", "New friend request!", "#ff5da2");
            }
          },
        );

        // ── Friend request accepted (UPDATE where status changes to accepted)
        c.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "friendships",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (disposed) return;
            const row = payload.new;
            const old = payload.old;
            if (
              row?.status === "accepted" &&
              old?.status === "pending" &&
              row?.requester_id === userId
            ) {
              pushToast("🤝", "Friend request accepted!", "#33c46a");
            }
          },
        );

        // ── New quest (INSERT where receiver_id = me)
        c.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "quests",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (disposed) return;
            const row = payload.new;
            if (row?.receiver_id === userId) {
              const title = row.title || row.description || "A new dare";
              pushToast(
                "⚔️",
                `New quest: "${title.length > 40 ? title.slice(0, 40) + "…" : title}"`,
                "oklch(0.74 0.18 145)",
              );
            }
          },
        );

        // ── Quest completed (UPDATE where giver_id = me and status -> completed)
        c.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "quests",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (disposed) return;
            const row = payload.new;
            const old = payload.old;
            if (
              row?.giver_id === userId &&
              row?.status === "completed" &&
              old?.status !== "completed"
            ) {
              pushToast("🏆", "A quest you gave was completed!", "#ffd23d");
            }
          },
        );

        c.subscribe();
        ch = c;
      } catch {
        /* realtime optional */
      }
    };

    try {
      const supabase = createClient();
      supabase.auth
        .getSession()
        .then(({ data }) => start(data.session?.access_token))
        .catch(() => start());
    } catch {
      /* ignore */
    }

    return () => {
      disposed = true;
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
      try {
        ch?.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, [userId, pushToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="mini-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="mini-toast"
          style={{ "--toast-accent": t.accent } as React.CSSProperties}
          onClick={() => dismiss(t.id)}
        >
          <span className="mini-toast-icon">{t.icon}</span>
          <span className="mini-toast-msg">{t.message}</span>
          <button className="mini-toast-close" aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
