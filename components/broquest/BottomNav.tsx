"use client";
// BroQuest — bottom navigation for the /app routes
import Link from "next/link";
import { usePathname } from "next/navigation";

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconCrew = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 20.5S3.5 15.5 3.5 9.6C3.5 6.9 5.6 5 8 5c1.7 0 3.1.9 4 2.3C12.9 5.9 14.3 5 16 5c2.4 0 4.5 1.9 4.5 4.6 0 5.9-8.5 10.9-8.5 10.9Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>
);
const IconShop = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
);
const IconProfile = () => (
  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="2.2" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
);

const TABS = [
  { href: "/app", label: "Quests", Icon: IconHome, exact: true },
  { href: "/app/friends", label: "Crew", Icon: IconCrew, exact: false },
] as const;
const TABS_RIGHT = [
  { href: "/app/shop", label: "Shop", Icon: IconShop, exact: false },
  { href: "/app/profile", label: "Me", Icon: IconProfile, exact: false },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const tab = (t: { href: string; label: string; Icon: () => React.JSX.Element; exact: boolean }) => (
    <Link key={t.href} href={t.href} className={"nav-btn" + (isActive(t.href, t.exact) ? " active" : "")}>
      <span className="ic"><t.Icon /></span>
      {t.label}
    </Link>
  );

  return (
    <div className="nav">
      {TABS.map(tab)}
      <Link href="/app/give" className="nav-fab" aria-label="Give a quest"><IconPlus /></Link>
      {TABS_RIGHT.map(tab)}
    </div>
  );
}
