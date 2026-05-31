// BroQuest — home: today's incoming quests
import { requireProfile } from "@/lib/auth";
import { getIncomingQuests } from "@/lib/queries";
import QuestFeed, { type FeedQuest } from "@/components/broquest/QuestFeed";
import Realtime from "@/components/broquest/Realtime";

export default async function AppHome() {
  const profile = await requireProfile();
  const incoming = await getIncomingQuests(profile.id);

  const quests: FeedQuest[] = incoming.map(({ quest, other }) => ({
    id: quest.id,
    description: quest.description || quest.title,
    reward: quest.reward_coins,
    gesture: quest.gesture,
    category: quest.category,
    status: quest.status,
    fromName: other.display_name,
    fromLook: other.avatar_look,
  }));

  return (
    <div>
      <Realtime channel={`home-${profile.id}`} subs={[{ table: "quests", filter: `receiver_id=eq.${profile.id}` }]} />
      <div style={{ padding: "2px 18px 0" }}>
        <div className="greet">
          Hey, {profile.display_name} 👋
          <small>Dare a friend. Keep your flame alive.</small>
        </div>
      </div>
      <QuestFeed initialQuests={quests} myLook={profile.avatar_look} />
    </div>
  );
}
