// BroQuest — shared domain types

export type Hair = "short" | "swoop" | "curls" | "buzz" | "bun" | "long";
export type Acc = "none" | "glasses" | "cap";

export interface Look {
  skin: string;
  hair: Hair;
  hairColor: string;
  acc?: Acc;
  capColor?: string;
}

export interface Bond {
  level: number;
  xp: number;
  xpMax: number;
}

export interface Friend {
  id: string;
  name: string;
  look: Look;
  title: string;
  bond: Bond;
}

export type QuestStatus = "active" | "done";

export interface Quest {
  id: string;
  fromId: string;
  text: string;
  reward: number;
  gesture: string;
  category: string;
  status: QuestStatus;
}

export interface Gesture {
  id: string;
  label: string;
  emoji: string;
  hand: "fist" | "palm";
  minBond: number;
  desc: string;
}

export interface Category {
  id: string;
  em: string;
  label: string;
}

export interface Diff {
  id: string;
  label: string;
  coins: number;
}

export interface GiveState {
  step: number;
  fid: string | null;
  text: string;
  cat: string;
  diff: string;
  gesture: string | null;
}

export interface CelebrationData {
  you: Look;
  friend: { id: string; name: string; look: Look };
  gesture: string;
  coins: number;
  bondGain: number;
  hype: string;
  questText: string;
  nonce: number;
}
