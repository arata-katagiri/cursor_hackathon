# 🔥 BroQuest

Give your friends quests, keep your streak flame alive, earn coins, and flex cosmetics.

BroQuest is a social app where friends challenge each other with **quests** over chat.
Completing quests earns **coins** and keeps a daily **streak flame (огонёк)** going.
Coins buy cosmetics: accessories, colored nicknames, and flame decorations.

- **1-on-1** — two friends quest each other.
- **Group circle** — each round, every member is randomly assigned to quest another member.
- **3 ways to author a quest** — write it yourself, give the AI an idea to expand, or let the AI write it fully.

See [`PRD.md`](./PRD.md) for the full product spec.

## Stack

- Next.js 16.2.6 (App Router) · React 19.2.4 · TypeScript
- Tailwind CSS v4 · shadcn / radix-ui
- Anthropic API for AI quest generation

> ⚠️ This project uses a non-standard build of Next.js (16.2.6) with breaking changes.
> Read the bundled guides in `node_modules/next/dist/docs/` before writing framework code.
> Notably: Middleware is now **Proxy** (`proxy.ts`), and Turbopack is the default bundler.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |

## Project layout

```
app/            App Router routes & layouts
components/ui/  shadcn UI primitives
lib/            Shared utilities
public/         Static assets
PRD.md          Product requirements
```
