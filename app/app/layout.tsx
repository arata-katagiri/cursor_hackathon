// BroQuest — authenticated app shell (frame + header + bottom nav)
import { requireProfile } from "@/lib/auth";
import BottomNav from "@/components/broquest/BottomNav";
import "@/app/broquest.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="bq-page">
      <div className="bq-app">
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px 8px",
            flexShrink: 0,
          }}
        >
          <span className="pill streak">
            <span className="glyph">🔥</span>
            {profile.streak_count}
          </span>
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>
            Bro<span style={{ color: "var(--primary)" }}>Quest</span>
          </span>
          <span className="pill coins">
            <span className="glyph">🪙</span>
            {profile.coin_balance}
          </span>
        </header>

        <div className="bq-content">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
