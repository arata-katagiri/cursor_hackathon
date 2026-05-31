// BroQuest — friends & requests
import { requireProfile } from "@/lib/auth";
import { getFriends, getIncomingRequests } from "@/lib/queries";
import FriendsManager, { type CrewMember } from "@/components/broquest/FriendsManager";

export default async function FriendsPage() {
  const profile = await requireProfile();
  const [friends, requests] = await Promise.all([
    getFriends(profile.id),
    getIncomingRequests(profile.id),
  ]);

  const crew: CrewMember[] = friends.map(({ profile: p, friendship }) => ({
    friendshipId: friendship.id,
    id: p.id,
    name: p.display_name,
    look: p.avatar_look,
    bondLevel: friendship.bond_level,
    bondXp: friendship.bond_xp,
    nicknameColor: p.nickname_color,
  }));

  const incoming: CrewMember[] = requests.map(({ profile: p, friendship }) => ({
    friendshipId: friendship.id,
    id: p.id,
    name: p.display_name,
    look: p.avatar_look,
    bondLevel: friendship.bond_level,
    bondXp: friendship.bond_xp,
    nicknameColor: p.nickname_color,
  }));

  return <FriendsManager crew={crew} incoming={incoming} />;
}
