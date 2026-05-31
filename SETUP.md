# BroQuest — Setup (2 manual steps, then run)

The whole system is built. Two one-time manual steps in the Supabase dashboard,
then `npm run dev`.

## 1. Apply the database schema  ⚠️ required

The app talks to Supabase tables that don't exist yet.

1. Open your project → **SQL Editor** → **New query**
   (https://supabase.com/dashboard/project/dfozldacxobattephnun/sql/new)
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. It creates all tables, RLS policies, the signup trigger,
   the `complete_quest` / `buy_cosmetic` functions, and seeds the shop.
   It's safe to re-run.

## 2. Turn off email confirmation  ⚠️ required for instant signup

So new accounts log in immediately (no email click) during the demo:

- Dashboard → **Authentication → Sign In / Providers → Email**
- Turn **OFF** "Confirm email" → Save.

(If you leave it on, signup creates the account but you must click the email
link before logging in.)

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000 → you'll land on `/login` → **Sign up**.

## Demo loop (open two browsers / one incognito = two accounts)

1. Sign up as **Alice** and **Bob** (incognito).
2. Alice → **Crew** tab → add Bob by his email → Bob accepts.
3. Alice → **✦ (give)** → pick Bob → try all 3 modes:
   **✍️ Write**, **✨ AI assist** (type an idea), **🎲 Surprise** (full AI) →
   category + difficulty → win gesture → **Send**.
4. Bob → **Quests** home → **Done! ✓** → 🎉 celebration → coins + streak flame.
5. Bob → **Shop** → buy a nickname color / glasses / flame → **Equip** → see it
   on the **Me** (profile) tab.
6. Groups: **Me → My circles** → create a circle, add friends → open it →
   **Start round 🎲** → random derangement assigns everyone a target →
   **Author their quest ✦**.
7. **Me → Messages** → open a chat → quests show inline, messages poll live.

## AI / env notes

- AI quest generation uses **OpenAI `gpt-4o-mini`** server-side
  (`OPENAI_API_KEY` in `.env.local`, called from `lib/ai/quests.ts`).
- If the key is missing/invalid, generation falls back to local templates so
  the demo never breaks.
- ⚠️ The key was pasted in chat — **rotate it** at platform.openai.com after the
  hackathon. `.env.local` is gitignored.
