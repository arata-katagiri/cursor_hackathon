import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 py-24 text-center">
        <div className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden>
            🔥
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
            BroQuest
          </h1>
        </div>

        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Challenge your friends with quests. Complete them to feed your streak
          flame, earn coins, and unlock cosmetics. Play 1-on-1 or in a friend
          circle.
        </p>

        <ul className="grid grid-cols-1 gap-3 text-left text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
          <li className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
            🎯 Quests from friends — write them yourself, with AI, or fully by AI
          </li>
          <li className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
            🔥 Daily streak flame — keep it alive every day
          </li>
          <li className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
            🪙 Earn coins — spend on accessories, nickname colors, flame decor
          </li>
          <li className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
            👥 Group circles — random quest assignments each round
          </li>
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-8 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
