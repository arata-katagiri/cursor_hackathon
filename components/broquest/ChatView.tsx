"use client";
// BroQuest — chat thread: messages, inline quest cards, composer, light polling
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { catById } from "./data";
import { sendMessage } from "@/app/actions/chat";
import { completeQuest } from "@/app/actions/quests";
import { useRealtimeRefresh } from "./Realtime";
import type { AvatarLook } from "@/lib/db/types";

export interface ChatMessage {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  senderLook: AvatarLook;
  quest?: {
    id: string;
    title: string;
    description: string;
    category: string;
    reward: number;
    status: string;
    canComplete: boolean;
  };
}

export default function ChatView({
  chatId,
  title,
  messages,
}: {
  chatId: string;
  title: string;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Realtime: push new messages instantly over a websocket (best-effort).
  useRealtimeRefresh(`chat-${chatId}`, [{ table: "messages", filter: `chat_id=eq.${chatId}` }]);

  // Polling fallback in case realtime is unavailable — slow, just a safety net.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setText("");
    await sendMessage(chatId, body);
    setBusy(false);
    router.refresh();
  }

  async function complete(questId: string) {
    setBusy(true);
    await completeQuest(questId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="screen-title" style={{ paddingBottom: 0 }}>{title}</div>
      <div className="screen-sub">Direct quests show up right here.</div>

      <div style={{ flex: 1, padding: "4px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && <div className="empty">No messages yet. Say hi 👋</div>}
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.mine ? "flex-end" : "flex-start" }}>
            {m.quest ? (
              <div className="quest" style={{ maxWidth: "85%", margin: 0 }}>
                <div className="q-top">
                  <div className="q-icon">{catById(m.quest.category).em}</div>
                  <div className="q-meta">
                    <div className="q-from">{m.mine ? "You dared them" : `from ${m.senderName}`}</div>
                    <div className="q-text">{m.quest.description || m.quest.title}</div>
                  </div>
                  <div className="q-reward"><span className="c">+{m.quest.reward}</span>coins</div>
                </div>
                <div className="q-foot">
                  <span className="gtag" style={{ background: m.quest.status === "completed" ? "var(--primary)" : "var(--tile)", color: m.quest.status === "completed" ? "#fff" : "var(--muted)" }}>
                    {m.quest.status === "completed" ? "Completed ✓" : m.quest.status}
                  </span>
                  {m.quest.canComplete && m.quest.status !== "completed" && (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} disabled={busy} onClick={() => complete(m.quest!.id)}>
                      Done! ✓
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "85%" }}>
                {!m.mine && <Avatar look={m.senderLook} size={26} smiley={false} />}
                <div
                  style={{
                    background: m.mine ? "var(--primary)" : "var(--surface)",
                    color: m.mine ? "var(--primary-ink)" : "var(--text)",
                    border: m.mine ? "none" : "2px solid var(--border)",
                    borderRadius: 16,
                    padding: "9px 13px",
                    fontWeight: 700,
                    fontSize: 14.5,
                  }}
                >
                  {m.body}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "8px 14px", position: "sticky", bottom: 0 }}>
        <input
          className="qinput"
          style={{ flex: 1 }}
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" style={{ width: 80 }} disabled={busy} onClick={send}>Send</button>
      </div>
    </div>
  );
}
