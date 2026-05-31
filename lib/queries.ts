// BroQuest — server-side data fetchers (run inside Server Components / actions)
import { createClient } from "@/lib/supabase/server";
import type {
  Cosmetic,
  Friendship,
  InventoryItem,
  Profile,
  Quest,
} from "@/lib/db/types";

export interface FriendView {
  friendship: Friendship;
  profile: Profile;
  /** True if the friendship is still pending and *I* am the one who must respond. */
  incomingRequest: boolean;
}

/** Accepted friends with the other person's profile attached. */
export async function getFriends(userId: string): Promise<FriendView[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  return attachOtherProfiles(rows ?? [], userId, false);
}

/** Pending friend requests addressed to me (need my accept/decline). */
export async function getIncomingRequests(userId: string): Promise<FriendView[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("addressee_id", userId);
  return attachOtherProfiles(rows ?? [], userId, true);
}

/** Pending requests I sent (waiting on them). */
export async function getOutgoingRequests(userId: string): Promise<FriendView[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("requester_id", userId);
  return attachOtherProfiles(rows ?? [], userId, false);
}

async function attachOtherProfiles(
  rows: Friendship[],
  userId: string,
  incoming: boolean
): Promise<FriendView[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const otherIds = rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", otherIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  return rows
    .map((friendship) => {
      const otherId = friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id;
      const profile = byId.get(otherId);
      return profile ? { friendship, profile, incomingRequest: incoming } : null;
    })
    .filter((x): x is FriendView => x !== null);
}

export interface QuestView {
  quest: Quest;
  other: Profile; // the giver (for incoming) or receiver (for outgoing)
}

/** Quests assigned to me that aren't finished yet, newest first, with giver profile. */
export async function getIncomingQuests(userId: string): Promise<QuestView[]> {
  const supabase = await createClient();
  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false });
  return attachProfiles(quests ?? [], "giver_id");
}

/** Quests I gave out, with receiver profile. */
export async function getOutgoingQuests(userId: string): Promise<QuestView[]> {
  const supabase = await createClient();
  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .eq("giver_id", userId)
    .order("created_at", { ascending: false });
  return attachProfiles(quests ?? [], "receiver_id");
}

async function attachProfiles(quests: Quest[], key: "giver_id" | "receiver_id"): Promise<QuestView[]> {
  if (!quests.length) return [];
  const supabase = await createClient();
  const ids = [...new Set(quests.map((q) => q[key]))];
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  return quests
    .map((quest) => {
      const other = byId.get(quest[key]);
      return other ? { quest, other } : null;
    })
    .filter((x): x is QuestView => x !== null);
}

export interface ShopCosmetic extends Cosmetic {
  owned: boolean;
  equipped: boolean;
}

/** All cosmetics annotated with ownership/equip state for the given user. */
export async function getShop(userId: string): Promise<ShopCosmetic[]> {
  const supabase = await createClient();
  const [{ data: cosmetics }, { data: inv }] = await Promise.all([
    supabase.from("cosmetics").select("*").order("price"),
    supabase.from("inventory").select("*").eq("user_id", userId),
  ]);
  const invById = new Map((inv ?? []).map((i: InventoryItem) => [i.cosmetic_id, i]));
  return (cosmetics ?? []).map((c: Cosmetic) => ({
    ...c,
    owned: invById.has(c.id),
    equipped: invById.get(c.id)?.equipped ?? false,
  }));
}
