// BroQuest — database row types (mirror of supabase/schema.sql)

export type FriendshipStatus = "pending" | "accepted" | "declined";
export type ChatType = "direct" | "group";
export type QuestStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "completed"
  | "expired";
export type AuthorMode = "manual" | "ai_assisted" | "ai_full";
export type CosmeticCategory = "accessory" | "nickname_color" | "flame_decoration";

export interface AvatarLook {
  skin: string;
  hair: "short" | "swoop" | "curls" | "buzz" | "bun" | "long";
  hairColor: string;
  acc?: "none" | "glasses" | "cap";
  capColor?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  nickname: string | null;
  nickname_color: string;
  coin_balance: number;
  streak_count: number;
  streak_last_fed: string | null;
  avatar_look: AvatarLook;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  bond_level: number;
  bond_xp: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  group_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  quest_id: string | null;
  created_at: string;
}

export interface QuestRound {
  id: string;
  group_id: string;
  status: "active" | "done";
  assignments: { giver: string; receiver: string }[];
  created_at: string;
}

export interface Quest {
  id: string;
  chat_id: string | null;
  giver_id: string;
  receiver_id: string;
  title: string;
  description: string;
  status: QuestStatus;
  reward_coins: number;
  proof_required: boolean;
  proof_text: string | null;
  author_mode: AuthorMode;
  category: string;
  gesture: string;
  round_id: string | null;
  proof_image_url: string | null;
  ai_score: number | null;
  ai_verdict: string | null;
  ai_feedback: string | null;
  proof_reviewed_at: string | null;
  created_at: string;
  completed_at: string | null;
}

/** AI verdict on a submitted proof photo. */
export interface ProofReview {
  score: number; // 0-100, how convincingly the photo shows the quest done
  verdict: string; // short hype headline
  feedback: string; // 1-2 encouraging sentences
  passed: boolean;
}

export interface Cosmetic {
  id: string;
  category: CosmeticCategory;
  name: string;
  price: number;
  asset_ref: string;
  created_at: string;
}

export interface InventoryItem {
  user_id: string;
  cosmetic_id: string;
  equipped: boolean;
  acquired_at: string;
}

// ── Server-action shared shapes (kept out of "use server" files) ─────────────
export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface CreateQuestInput {
  receiverId: string;
  title: string;
  description: string;
  rewardCoins: number;
  proofRequired?: boolean;
  authorMode?: AuthorMode;
  category?: string;
  gesture?: string;
  roundId?: string | null;
}

export interface CompleteResult {
  rewardCoins: number;
  coinBalance: number;
  streakCount: number;
}
