// BroQuest — chat thread (direct or group) with inline quests
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ChatView, { type ChatMessage } from "@/components/broquest/ChatView";
import type { Message, Profile, Quest } from "@/lib/db/types";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: chat } = await supabase.from("chats").select("*").eq("id", chatId).single();
  if (!chat) notFound();

  const [{ data: parts }, { data: msgs }] = await Promise.all([
    supabase.from("chat_participants").select("user_id").eq("chat_id", chatId),
    supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true }),
  ]);

  const participantIds = (parts ?? []).map((p) => p.user_id);
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", participantIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  const messages = (msgs ?? []) as Message[];
  const questIds = messages.map((m) => m.quest_id).filter(Boolean) as string[];
  const questById = new Map<string, Quest>();
  if (questIds.length) {
    const { data: quests } = await supabase.from("quests").select("*").in("id", questIds);
    for (const q of (quests ?? []) as Quest[]) questById.set(q.id, q);
  }

  const view: ChatMessage[] = messages.map((m) => {
    const sender = byId.get(m.sender_id);
    const quest = m.quest_id ? questById.get(m.quest_id) : undefined;
    return {
      id: m.id,
      body: m.body,
      mine: m.sender_id === profile.id,
      senderName: sender?.display_name ?? "?",
      senderLook: sender?.avatar_look ?? { skin: "#f1c89f", hair: "short", hairColor: "#3a2b1f", acc: "none" },
      quest: quest
        ? {
            id: quest.id,
            title: quest.title,
            description: quest.description,
            category: quest.category,
            reward: quest.reward_coins,
            status: quest.status,
            canComplete: quest.receiver_id === profile.id,
          }
        : undefined,
    };
  });

  let title = "Chat";
  if (chat.type === "group" && chat.group_id) {
    const { data: g } = await supabase.from("groups").select("name").eq("id", chat.group_id).single();
    title = g?.name ?? "Circle";
  } else {
    const other = (profiles ?? []).find((p) => p.id !== profile.id) as Profile | undefined;
    title = other?.display_name ?? "Chat";
  }

  return <ChatView chatId={chatId} title={title} messages={view} />;
}
