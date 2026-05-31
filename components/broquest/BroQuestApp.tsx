"use client";
// BroQuest — app shell: state machine, navigation, screen orchestration
import { useRef, useState, type MouseEvent } from "react";
import Avatar from "./Avatar";
import Celebration from "./Celebration";
import HomeScreen from "./HomeScreen";
import GiveScreen from "./GiveScreen";
import FriendsScreen from "./FriendsScreen";
import {
  FRIENDS_INIT,
  GIVE_INIT,
  HYPE,
  LOOKS,
  QUESTS_INIT,
  applyBond,
  rand,
} from "./data";
import type { CelebrationData, Friend, GiveState, Quest } from "./types";

// ---- nav icons ----
const IconHome = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconCrew = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M12 20.5S3.5 15.5 3.5 9.6C3.5 6.9 5.6 5 8 5c1.7 0 3.1.9 4 2.3C12.9 5.9 14.3 5 16 5c2.4 0 4.5 1.9 4.5 4.6 0 5.9-8.5 10.9-8.5 10.9Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>);
const IconPlus = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>);

interface SentData { name: string; look: Friend["look"]; text: string }

function SentView({ data, onClose }: { data: SentData; onClose: () => void }) {
  return (
    <div className="sent-wrap">
      <div className="sent-emoji">🚀</div>
      <div className="sent-h">Quest sent!</div>
      <div className="sent-p">
        <b>{data.name}</b> just got dared:<br />
        <span style={{ color: "var(--text)", fontWeight: 800 }}>“{data.text}”</span>
      </div>
      <div style={{ margin: "18px 0 22px" }}><Avatar look={data.look} size={84} /></div>
      <button className="btn btn-primary" style={{ maxWidth: 240 }} onClick={onClose}>Back home</button>
    </div>
  );
}

type Screen = "home" | "give" | "friends";

export default function BroQuestApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [coins, setCoins] = useState(340);
  const [streak] = useState(6);
  const [friends, setFriends] = useState<Friend[]>(FRIENDS_INIT);
  const [quests, setQuests] = useState<Quest[]>(QUESTS_INIT);
  const [give, setGiveState] = useState<GiveState>(GIVE_INIT);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [sent, setSent] = useState<SentData | null>(null);
  const [toast, setToast] = useState("");
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const screenRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const friendsById: Record<string, Friend> = Object.fromEntries(friends.map((f) => [f.id, f] as const));
  const dateLabel = "Saturday, May 31";

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function goto(s: Screen) {
    if (s === "give") setGiveState(GIVE_INIT);
    setScreen(s);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function completeQuest(q: Quest) {
    const f = friendsById[q.fromId];
    setCelebration({
      you: LOOKS.you,
      friend: { id: f.id, name: f.name, look: f.look },
      gesture: q.gesture, coins: q.reward, bondGain: 15,
      hype: rand(HYPE), questText: q.text, nonce: Date.now(),
    });
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, status: "done" as const } : x)));
  }

  function closeCelebration() {
    const c = celebration;
    setCelebration(null);
    if (c) {
      setCoins((v) => v + c.coins);
      setFriends((prev) => prev.map((f) => (f.id === c.friend.id ? { ...f, bond: applyBond(f.bond, c.bondGain) } : f)));
      showToast(`+${c.coins} coins · +${c.bondGain} bond ❤`);
    }
  }

  function handleSend() {
    const friend = friends.find((f) => f.id === give.fid);
    if (!friend) return;
    setSent({ name: friend.name, look: friend.look, text: give.text.trim() });
    setFriends((prev) => prev.map((f) => (f.id === friend.id ? { ...f, bond: applyBond(f.bond, 8) } : f)));
  }

  function closeSent() {
    setSent(null);
    setGiveState(GIVE_INIT);
    setScreen("home");
    showToast("Quest sent! 🚀");
  }

  function cheer(f: Friend, e: MouseEvent<HTMLButtonElement>) {
    setFriends((prev) => prev.map((x) => (x.id === f.id ? { ...x, bond: applyBond(x.bond, 12) } : x)));
    if (!screenRef.current) return;
    const host = screenRef.current.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    const id = Math.random();
    const x = r.left - host.left + r.width / 2;
    const y = r.top - host.top - 6;
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((z) => z.id !== id)), 1000);
    showToast(`You hyped up ${f.name}! +12 bond`);
  }

  function giveFromFriend(f: Friend) {
    setGiveState({ ...GIVE_INIT, fid: f.id });
    setScreen("give");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  const setGive = (patch: Partial<GiveState>) => setGiveState((g) => ({ ...g, ...patch }));
  const inGive = screen === "give" && !sent;
  const canNext = give.step === 1 ? !!give.fid : give.step === 2 ? give.text.trim().length > 2 : !!give.gesture;

  function giveNext() {
    if (give.step < 3) {
      setGive({ step: give.step + 1 });
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      return;
    }
    handleSend();
  }

  return (
    <div className="bq-app" ref={screenRef}>
      <div className="bq-content" ref={scrollRef}>
        {screen === "home" && <HomeScreen state={{ coins, streak, quests, dateLabel }} friendsById={friendsById} onComplete={completeQuest} />}
        {screen === "give" && <GiveScreen friends={friends} give={give} set={setGive} />}
        {screen === "friends" && <FriendsScreen friends={friends} onCheer={cheer} onGive={giveFromFriend} />}
      </div>

      {/* Give flow footer pinned to the frame */}
      {inGive && (
        <div className="give-footer">
          <button className="btn btn-ghost" style={{ width: 96 }} onClick={() => (give.step > 1 ? setGive({ step: give.step - 1 }) : goto("home"))}>
            {give.step > 1 ? "Back" : "Cancel"}
          </button>
          <button className="btn btn-primary" disabled={!canNext} onClick={giveNext}>
            {give.step < 3 ? "Continue" : "Send quest ✦"}
          </button>
        </div>
      )}

      {/* bottom nav (hidden during give flow / sent overlay) */}
      {!inGive && !sent && (
        <div className="nav">
          <button className={"nav-btn" + (screen === "home" ? " active" : "")} onClick={() => goto("home")}>
            <span className="ic"><IconHome /></span>Quests
          </button>
          <button className="nav-fab" onClick={() => goto("give")} aria-label="Give a quest"><IconPlus /></button>
          <button className={"nav-btn" + (screen === "friends" ? " active" : "")} onClick={() => goto("friends")}>
            <span className="ic"><IconCrew /></span>Crew
          </button>
        </div>
      )}

      {hearts.map((h) => (<span key={h.id} className="heartfx" style={{ left: h.x, top: h.y }}>❤️</span>))}
      {toast && <div className="toast show">{toast}</div>}
      {sent && <SentView data={sent} onClose={closeSent} />}
      <Celebration key={celebration?.nonce ?? "idle"} active={!!celebration} data={celebration} onClose={closeCelebration} />
    </div>
  );
}
