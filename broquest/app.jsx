/* global React, ReactDOM, Avatar, LOOKS, Celebration, GESTURES, gestureById, HYPE,
   HomeScreen, GiveScreen, FriendsScreen, DIFFS */
// ===========================================================
// BroQuest — app shell, navigation, comparison canvas
// ===========================================================
const { useState, useEffect, useRef } = React;

const FRIENDS_INIT = [
  { id: "theo", name: "Theo", look: LOOKS.theo, title: "ride or die",  bond: { level: 5, xp: 50,  xpMax: 150 } },
  { id: "maya", name: "Maya", look: LOOKS.maya, title: "day-one",      bond: { level: 4, xp: 80,  xpMax: 120 } },
  { id: "sana", name: "Sana", look: LOOKS.sana, title: "hype squad",   bond: { level: 3, xp: 40,  xpMax: 100 } },
  { id: "leo",  name: "Leo",  look: LOOKS.leo,  title: "newish bro",   bond: { level: 2, xp: 55,  xpMax: 80 } },
  { id: "cole", name: "Cole", look: LOOKS.cole, title: "just met",     bond: { level: 1, xp: 20,  xpMax: 60 } },
];

const QUESTS_INIT = [
  { id: "q1", fromId: "theo", text: "Run to the top of the hill for sunrise 🌄", reward: 50,  gesture: "high5", category: "fitness", status: "active" },
  { id: "q2", fromId: "maya", text: "Text your mom something nice 💛",           reward: 30,  gesture: "wave",  category: "social",  status: "active" },
  { id: "q3", fromId: "sana", text: "No phone for 2 hours — go touch grass",      reward: 50,  gesture: "fist",  category: "mind",    status: "active" },
  { id: "q4", fromId: "leo",  text: "Cook something you've never made before",    reward: 100, gesture: "fist",  category: "food",    status: "active" },
];

const GIVE_INIT = { step: 1, fid: null, text: "", cat: "fitness", diff: "solid", gesture: null };

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function applyBond(bond, amt) {
  let { level, xp, xpMax } = bond;
  xp += amt;
  while (xp >= xpMax && level < 5) { xp -= xpMax; level += 1; xpMax += 40; }
  if (level >= 5) xp = Math.min(xp, xpMax);
  return { level, xp, xpMax };
}

// ---- nav icons ----
const IconHome = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconCrew = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M12 20.5S3.5 15.5 3.5 9.6C3.5 6.9 5.6 5 8 5c1.7 0 3.1.9 4 2.3C12.9 5.9 14.3 5 16 5c2.4 0 4.5 1.9 4.5 4.6 0 5.9-8.5 10.9-8.5 10.9Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/></svg>);
const IconPlus = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>);

function SentView({ data, onClose }) {
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

function PhoneApp({ theme, jump }) {
  const [screen, setScreen] = useState("home");
  const [coins, setCoins] = useState(340);
  const [streak] = useState(6);
  const [friends, setFriends] = useState(FRIENDS_INIT);
  const [quests, setQuests] = useState(QUESTS_INIT);
  const [give, setGiveState] = useState(GIVE_INIT);
  const [celebration, setCelebration] = useState(null);
  const [sent, setSent] = useState(null);
  const [toast, setToast] = useState("");
  const [hearts, setHearts] = useState([]);
  const screenRef = useRef(null);
  const scrollRef = useRef(null);
  const toastTimer = useRef(null);

  const friendsById = Object.fromEntries(friends.map((f) => [f.id, f]));
  const dateLabel = "Saturday, May 31";

  // respond to the "compare" controls in the header
  useEffect(() => {
    if (!jump || !jump.nonce) return;
    if (jump.screen === "celebrate") { triggerDemo(); return; }
    setSent(null);
    setCelebration(null);
    if (jump.screen === "give") { setGiveState(GIVE_INIT); }
    setScreen(jump.screen);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // eslint-disable-next-line
  }, [jump && jump.nonce]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function goto(s) {
    if (s === "give") setGiveState(GIVE_INIT);
    setScreen(s);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function completeQuest(q) {
    const f = friendsById[q.fromId];
    setCelebration({
      you: LOOKS.you,
      friend: { id: f.id, name: f.name, look: f.look },
      gesture: q.gesture, coins: q.reward, bondGain: 15,
      hype: rand(HYPE), questText: q.text, nonce: Date.now(),
    });
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, status: "done" } : x)));
  }

  function triggerDemo() {
    const q = QUESTS_INIT.find((x) => x.id === "q1");
    const f = FRIENDS_INIT.find((x) => x.id === q.fromId);
    setSent(null);
    setScreen("home");
    setCelebration({
      you: LOOKS.you,
      friend: { id: f.id, name: f.name, look: f.look },
      gesture: q.gesture, coins: q.reward, bondGain: 15,
      hype: rand(HYPE), questText: q.text, nonce: Date.now(),
    });
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
    const diffObj = DIFFS.find((d) => d.id === give.diff);
    setSent({ name: friend.name, look: friend.look, text: give.text.trim() });
    setFriends((prev) => prev.map((f) => (f.id === friend.id ? { ...f, bond: applyBond(f.bond, 8) } : f)));
  }

  function closeSent() {
    setSent(null);
    setGiveState(GIVE_INIT);
    setScreen("home");
    showToast("Quest sent! 🚀");
  }

  function cheer(f, e) {
    setFriends((prev) => prev.map((x) => (x.id === f.id ? { ...x, bond: applyBond(x.bond, 12) } : x)));
    const host = screenRef.current.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    const id = Math.random();
    const x = r.left - host.left + r.width / 2;
    const y = r.top - host.top - 6;
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((z) => z.id !== id)), 1000);
    showToast(`You hyped up ${f.name}! +12 bond`);
  }

  function giveFromFriend(f) {
    setGiveState({ ...GIVE_INIT, fid: f.id });
    setScreen("give");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  const setGive = (patch) => setGiveState((g) => ({ ...g, ...patch }));
  const inGive = screen === "give" && !sent;
  const giveFriend = friends.find((f) => f.id === give.fid);
  const canNext = give.step === 1 ? !!give.fid : give.step === 2 ? give.text.trim().length > 2 : !!give.gesture;
  function giveNext() {
    if (give.step < 3) { setGive({ step: give.step + 1 }); if (scrollRef.current) scrollRef.current.scrollTop = 0; return; }
    handleSend();
  }

  return (
    <div className="phone" data-theme={theme}>
      <div className="phone-screen" ref={screenRef}>
        <div className="notch" />
        <div className="statusbar">
          <span className="sb-time">9:41</span>
          <span className="sb-icons"><i className="net" /><i className="bat" /></span>
        </div>

        <div className="screen-content" ref={scrollRef}>
          {screen === "home" && <HomeScreen state={{ coins, streak, quests, dateLabel }} friendsById={friendsById} onComplete={completeQuest} />}
          {screen === "give" && <GiveScreen friends={friends} give={give} set={setGive} />}
          {screen === "friends" && <FriendsScreen friends={friends} onCheer={cheer} onGive={giveFromFriend} />}
        </div>

        {/* Give flow footer pinned to the frame */}
        {inGive && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 18px 22px", background: "linear-gradient(to top, var(--bg) 76%, transparent)", display: "flex", gap: 10, zIndex: 26 }}>
            <button className="btn btn-ghost" style={{ width: 96 }} onClick={() => (give.step > 1 ? setGive({ step: give.step - 1 }) : goto("home"))}>
              {give.step > 1 ? "Back" : "Cancel"}
            </button>
            <button className="btn btn-primary" disabled={!canNext} onClick={giveNext}>
              {give.step < 3 ? "Continue" : "Send quest ✦"}
            </button>
          </div>
        )}

        {/* bottom nav (hidden during give flow) */}
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
        <Celebration active={!!celebration} data={celebration} onClose={closeCelebration} />
      </div>
    </div>
  );
}

// ---------- comparison canvas ----------
const DIRECTIONS = [
  { theme: "duo",    name: "Duo Sunshine", tagline: "Warm, chunky & friendly — pressable 3D buttons, the classic streak-fire energy.", swatches: ["#fff9ee", "oklch(0.74 0.18 145)", "oklch(0.83 0.16 85)"] },
  { theme: "arcade", name: "Arcade Night", tagline: "Dark neon, gamer-grade glow. Quests feel like missions, wins feel like high scores.", swatches: ["#14111f", "oklch(0.82 0.2 162)", "oklch(0.72 0.22 350)"] },
  { theme: "candy",  name: "Candy Pop",    tagline: "Soft bubblegum, sticker-sweet gradients. Playful and a little Y2K.", swatches: ["#fff0f7", "oklch(0.7 0.2 350)", "oklch(0.78 0.16 200)"] },
];

const COMPARE = [
  { id: "home", label: "Home feed" },
  { id: "give", label: "Give a quest" },
  { id: "celebrate", label: "🔥 Celebration" },
  { id: "friends", label: "Crew & bonds" },
];

function ComparisonRoot() {
  const [jump, setJump] = useState(null);
  const [activeCompare, setActiveCompare] = useState(null);

  function doCompare(id) {
    setActiveCompare(id);
    setJump({ screen: id, nonce: Date.now() });
  }

  return (
    <div>
      <div className="cq-header">
        <div className="cq-badge"><span className="dot" /> BroQuest · Prototype</div>
        <h1 className="cq-title">Give your crew a quest. Win together. 🔥</h1>
        <p className="cq-sub">Three living visual directions of the same app — each fully clickable. Complete a quest to trigger the over-the-top gesture-and-fire celebration. Try them side by side, then jump every phone to the same screen with the buttons below.</p>
        <div className="cq-compare">
          <span className="lbl">Jump all to:</span>
          {COMPARE.map((c) => (
            <button key={c.id} className={"cq-chip" + (activeCompare === c.id ? " active" : "")} onClick={() => doCompare(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="cq-row">
        {DIRECTIONS.map((d) => (
          <div className="cq-col" key={d.theme}>
            <div className="cq-name">{d.name}
              <span className="cq-swatches">{d.swatches.map((s, i) => <i key={i} style={{ background: s }} />)}</span>
            </div>
            <div className="cq-tagline">{d.tagline}</div>
            <PhoneApp theme={d.theme} jump={jump} />
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ComparisonRoot />);
