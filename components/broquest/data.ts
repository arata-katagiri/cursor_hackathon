// BroQuest — character roster, quests, gestures, categories + helpers
import type {
  Bond,
  Category,
  Diff,
  Friend,
  Gesture,
  GiveState,
  Look,
  Quest,
} from "./types";

// ---- character roster ----
export const LOOKS: Record<string, Look> = {
  you: { skin: "#f1c89f", hair: "short", hairColor: "#3a2b1f", acc: "none" },
  theo: { skin: "#cd9f74", hair: "curls", hairColor: "#1d1a18", acc: "glasses" },
  maya: { skin: "#e8b489", hair: "long", hairColor: "#5a2a17", acc: "none" },
  sana: { skin: "#d79f68", hair: "bun", hairColor: "#241712", acc: "none" },
  leo: { skin: "#f0c096", hair: "buzz", hairColor: "#211d1a", acc: "cap", capColor: "#2f6df0" },
  cole: { skin: "#b9835c", hair: "swoop", hairColor: "#2a2018", acc: "none" },
};

export const FRIENDS_INIT: Friend[] = [
  { id: "theo", name: "Theo", look: LOOKS.theo, title: "ride or die", bond: { level: 5, xp: 50, xpMax: 150 } },
  { id: "maya", name: "Maya", look: LOOKS.maya, title: "day-one", bond: { level: 4, xp: 80, xpMax: 120 } },
  { id: "sana", name: "Sana", look: LOOKS.sana, title: "hype squad", bond: { level: 3, xp: 40, xpMax: 100 } },
  { id: "leo", name: "Leo", look: LOOKS.leo, title: "newish bro", bond: { level: 2, xp: 55, xpMax: 80 } },
  { id: "cole", name: "Cole", look: LOOKS.cole, title: "just met", bond: { level: 1, xp: 20, xpMax: 60 } },
];

export const QUESTS_INIT: Quest[] = [
  { id: "q1", fromId: "theo", text: "Run to the top of the hill for sunrise 🌄", reward: 50, gesture: "high5", category: "fitness", status: "active" },
  { id: "q2", fromId: "maya", text: "Text your mom something nice 💛", reward: 30, gesture: "wave", category: "social", status: "active" },
  { id: "q3", fromId: "sana", text: "No phone for 2 hours — go touch grass", reward: 50, gesture: "fist", category: "mind", status: "active" },
  { id: "q4", fromId: "leo", text: "Cook something you've never made before", reward: 100, gesture: "fist", category: "food", status: "active" },
];

export const GIVE_INIT: GiveState = { step: 1, fid: null, text: "", cat: "fitness", diff: "solid", gesture: null };

export const CATEGORIES: Category[] = [
  { id: "fitness", em: "💪", label: "Move" },
  { id: "social", em: "🎉", label: "Social" },
  { id: "mind", em: "🧠", label: "Mind" },
  { id: "create", em: "🎨", label: "Create" },
  { id: "food", em: "🥗", label: "Food" },
  { id: "dare", em: "😈", label: "Dare" },
];

export const DIFFS: Diff[] = [
  { id: "chill", label: "Chill", coins: 20 },
  { id: "solid", label: "Solid", coins: 50 },
  { id: "beast", label: "Beast", coins: 100 },
];

export const GESTURES: Gesture[] = [
  { id: "wave", label: "Wave", emoji: "👋", hand: "fist", minBond: 1, desc: "A friendly hello" },
  { id: "fist", label: "Fist Bump", emoji: "👊", hand: "fist", minBond: 2, desc: "Classic respect" },
  { id: "high5", label: "High Five", emoji: "🙌", hand: "palm", minBond: 3, desc: "Up top!" },
  { id: "brohug", label: "Bro Hug", emoji: "🤗", hand: "palm", minBond: 4, desc: "Come here, you" },
  { id: "handshake", label: "Secret Handshake", emoji: "🤝", hand: "palm", minBond: 5, desc: "Only the realest know it" },
];

export const HYPE = ["LEGEND!", "FIRE!", "EPIC!", "NICE ONE!", "GOATED!"];

export const CONFETTI_COLORS = ["#ff5252", "#ffd23d", "#33c46a", "#3aa0ff", "#b56bff", "#ff7ac0"];

// ---- helpers ----
export const catById = (id: string): Category => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
export const gestureById = (id: string): Gesture => GESTURES.find((g) => g.id === id) || GESTURES[0];
export const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function applyBond(bond: Bond, amt: number): Bond {
  let { level, xp, xpMax } = bond;
  xp += amt;
  while (xp >= xpMax && level < 5) {
    xp -= xpMax;
    level += 1;
    xpMax += 40;
  }
  if (level >= 5) xp = Math.min(xp, xpMax);
  return { level, xp, xpMax };
}
