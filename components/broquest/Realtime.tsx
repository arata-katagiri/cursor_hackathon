"use client";
// BroQuest — fail-safe Supabase Realtime refresher.
//
// Subscribes to postgres_changes over a websocket and debounce-refreshes the
// current route when a relevant row changes. EVERY step is wrapped so a failure
// (realtime disabled, table not on the publication, RLS, dropped socket, no
// session) can never break the page — it silently degrades to the normal
// navigation/action refreshes (and, in chat, the existing polling fallback).
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface RealtimeSub {
  table: string;
  /** postgres_changes filter, e.g. `chat_id=eq.<uuid>`. Omit to rely on RLS. */
  filter?: string;
  /** Defaults to "*" (INSERT/UPDATE/DELETE). */
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
}

export function useRealtimeRefresh(channel: string, subs: RealtimeSub[]) {
  const router = useRouter();
  const subsKey = JSON.stringify(subs);

  useEffect(() => {
    let disposed = false;
    // Typed loosely on purpose: realtime is best-effort and fully guarded.
    let ch: { unsubscribe: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!disposed) router.refresh();
      }, 300);
    };

    try {
      const supabase = createClient();
      const parsed: RealtimeSub[] = JSON.parse(subsKey);

      const start = (token?: string) => {
        if (disposed) return;
        try {
          // RLS on realtime is evaluated with the user's JWT — set it before
          // subscribing so we actually receive our own rows.
          if (token) supabase.realtime.setAuth(token);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c: any = supabase.channel(channel);
          for (const s of parsed) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cfg: any = { event: s.event ?? "*", schema: "public", table: s.table };
            if (s.filter) cfg.filter = s.filter;
            c.on("postgres_changes", cfg, refresh);
          }
          c.subscribe();
          ch = c;
        } catch {
          /* realtime optional — ignore */
        }
      };

      supabase.auth
        .getSession()
        .then(({ data }) => start(data.session?.access_token))
        .catch(() => start());
    } catch {
      /* realtime optional — page still works without it */
    }

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      try {
        ch?.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, [channel, subsKey, router]);
}

export default function Realtime({ channel, subs }: { channel: string; subs: RealtimeSub[] }) {
  useRealtimeRefresh(channel, subs);
  return null;
}
