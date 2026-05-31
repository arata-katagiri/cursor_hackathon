# BroQuest — Product Requirements Document

**Status:** Draft v0.1
**Last updated:** 2026-05-31
**Owner:** Hackathon team
**Stack:** Next.js 16.2.6 (App Router) · React 19.2.4 · TypeScript · Tailwind v4 · shadcn/radix-ui

---

## 1. Summary

BroQuest is a social app where friends give each other "quests" (challenges/tasks) over chat. Completing quests earns **coins** and keeps a daily **streak flame (огонёк)** alive. Coins are spent on cosmetics: accessories, colored nicknames, and flame decorations.

Two modes of play:

- **1-on-1 chat** — two friends quest each other directly.
- **Group (friend circle)** — every member is randomly assigned to give a quest to another member each round.

Quests can be authored three ways at any point: fully by the user, AI-assisted from the user's idea, or fully AI-generated.

## 2. Goals & Non-Goals

### Goals
- Make giving and completing challenges between friends fast and fun.
- Reward consistency through a streak flame that must be fed daily.
- Use AI to lower the friction of "what quest do I give?".
- Ship a working hackathon demo: auth → friends → chat → quest → complete → coins → streak → shop.

### Non-Goals (v1)
- Public/global feed or discovery of strangers.
- Real-money purchases (coins are soft currency only).
- Native mobile apps (responsive web first).
- Moderation at scale / trust & safety tooling beyond basic reporting.

## 3. Personas

- **The Challenger** — loves daring friends, wants quick AI help to phrase fun quests.
- **The Streak-keeper** — motivated by the flame and cosmetics, logs in daily.
- **The Group ringleader** — runs a circle of friends, enjoys the random quest assignment chaos.

## 4. Core Concepts (Domain Model)

| Concept | Description |
|---|---|
| **User** | Account with profile: display name, nickname color, equipped cosmetics, coin balance, streak state. |
| **Friendship** | Accepted bidirectional link between two users. |
| **Group** | A named circle of N users (the "friend circle"). |
| **Chat** | A conversation thread, either `direct` (1-on-1) or `group`. |
| **Message** | Text in a chat. May reference a quest. |
| **Quest** | A task: title/body, giver, receiver, status, optional proof, coin reward, due/expiry. |
| **QuestRound** (group) | One cycle where the system assigns each member a target to quest. |
| **Coin balance** | Soft currency earned by completing quests / streak bonuses. |
| **Streak (огонёк)** | Per-user (and optionally per-relationship) consecutive-day counter; resets if a day is missed. |
| **Cosmetic** | Purchasable item: accessory, nickname color, flame decoration. |
| **Inventory** | Cosmetics a user owns; subset equipped. |

## 5. Features

### 5.1 Auth & Onboarding
- Sign up / sign in.
- Create profile (display name, starting nickname).
- Add first friend (invite link or username) or create a group.

### 5.2 Friends & Groups
- Send/accept/decline friend requests.
- Create a group, name it, add friends.
- View members, leave group.

### 5.3 Chat
- Direct (1-on-1) and group chat threads.
- Real-time-ish message delivery (polling or websockets; polling acceptable for demo).
- Quests rendered inline as special message cards (status: assigned → in progress → submitted → completed/expired).

### 5.4 Quest Authoring (3 modes) — **central feature**
When a user gives a quest, they pick one of:

1. **Manual** — write the full quest text themselves.
2. **AI-assisted** — type an idea / a few thoughts; AI expands it into a complete quest.
3. **AI-full** — AI generates a full quest from context (relationship, history, difficulty preference) with no input.

Output of all three: a quest with title, description, suggested coin reward, optional proof requirement.

### 5.5 1-on-1 Quest Flow
- Giver authors a quest (any of the 3 modes) → assigns to the friend.
- Receiver sees quest card, marks **in progress**, then **submits** (text and/or proof).
- Giver confirms completion → receiver earns coins + streak credit for the day.

### 5.6 Group Quest Flow (random assignment)
- A **QuestRound** assigns each member exactly one target to give a quest to, forming a derangement (no one quests themselves) — ideally a single cycle, e.g. `1→3, 3→2, 2→4, 4→1`.
- Each giver authors their quest using the same 3 modes and assigns to their target.
- Receivers complete + submit; givers confirm; coins + streak credit awarded.
- New round can be started (manual trigger for demo; scheduled later).

### 5.7 Coins & Economy
- Earned: completing a quest (reward set at authoring, within bounds), streak milestone bonuses.
- Spent: cosmetics in the shop.
- Balance shown in header/profile.

### 5.8 Streak Flame (огонёк)
- Each day a user completes ≥1 quest, the flame is fed → streak +1.
- Miss a day → streak resets (with possible grace/"freeze" cosmetic later).
- Flame visual scales / changes with streak length; decorations from shop alter its look.

### 5.9 Shop & Cosmetics
- Browse cosmetics by category: **accessories**, **nickname colors**, **flame decorations**.
- Buy with coins → added to inventory.
- Equip/unequip from profile.

### 5.10 Profile
- Avatar + equipped accessories, colored nickname, flame + decoration, streak count, coin balance, quest stats.

## 6. AI Requirements

- **Model:** default to latest capable Claude (e.g. `claude-opus-4-8` for quality, `claude-haiku-4-5` for cheap/fast generation) via the Anthropic API.
- **Quest generation prompt** takes: mode (assisted/full), giver+receiver names, relationship/group context, optional user seed text, difficulty/tone preference, history (recent quests to avoid repeats).
- **Output schema:** `{ title, description, suggestedCoins, proofRequired, tone }` — structured/JSON.
- **Guardrails:** keep quests safe, legal, non-harmful, friendly; refuse dangerous dares. Content filter on generated and manual quests.
- Streaming optional; structured JSON output preferred for reliable rendering.

## 7. Screens / Routes (App Router)

> Routing/data APIs follow this project's Next.js 16.2.6 docs in `node_modules/next/dist/docs/` — verify before implementing.

- `/` — landing / redirect to app if authed.
- `/login`, `/signup` — auth.
- `/app` — home: chats list, streak flame, coin balance.
- `/app/friends` — friends & requests.
- `/app/groups`, `/app/groups/[id]` — group management.
- `/app/chat/[chatId]` — direct or group chat with inline quests.
- `/app/quests` — incoming/outgoing quests overview.
- `/app/shop` — cosmetics shop.
- `/app/profile` — profile & equip cosmetics.

## 8. Data Model (initial sketch)

```text
User            id, email, displayName, nickname, nicknameColor, coinBalance,
                streakCount, streakLastFedDate, equippedCosmetics[], createdAt
Friendship      id, userAId, userBId, status(pending|accepted), createdAt
Group           id, name, ownerId, createdAt
GroupMember     groupId, userId, joinedAt
Chat            id, type(direct|group), groupId?, createdAt
ChatParticipant chatId, userId
Message         id, chatId, senderId, body, questId?, createdAt
Quest           id, chatId, giverId, receiverId, title, description,
                status(assigned|in_progress|submitted|completed|expired),
                rewardCoins, proofRequired, proofText?, authorMode(manual|ai_assisted|ai_full),
                roundId?, createdAt, completedAt
QuestRound      id, groupId, status(active|done), assignments(json: giver→receiver), createdAt
Cosmetic        id, category(accessory|nickname_color|flame_decoration), name, price, assetRef
Inventory       userId, cosmeticId, acquiredAt
```

## 9. Tech Architecture

- **Frontend/Backend:** Next.js 16.2.6 App Router (server components + route handlers / server actions per project docs).
- **DB:** start with a lightweight option for the hackathon (e.g. SQLite/Prisma or a hosted Postgres). TBD — see Open Questions.
- **AI:** Anthropic API via server-side route handler (never expose key client-side). Include prompt caching.
- **Auth:** simple session-based or a provider; TBD.
- **Realtime:** polling for demo; upgrade path to websockets.
- **UI:** Tailwind v4 + shadcn components already scaffolded (`components/ui`).

## 10. Milestones

1. **M0 — Setup** (this doc + project skeleton, deps installed, env, DB schema).
2. **M1 — Auth + Friends + Direct chat** (no quests yet).
3. **M2 — Quest authoring (3 modes) + AI integration + 1-on-1 quest flow + coins.**
4. **M3 — Streak flame + Shop + cosmetics + profile equip.**
5. **M4 — Groups + random quest rounds.**
6. **M5 — Polish, demo script, seed data.**

## 11. Success Metrics (demo)

- A full loop is demoable: give quest (all 3 modes) → complete → earn coins → streak increments → buy + equip cosmetic.
- Group round assigns a valid derangement and all members can act.
- AI quest generation returns a usable quest in < a few seconds.

## 12. Open Questions

- Database + auth provider choice for the hackathon?
- Is streak per-user global, or per-friendship/group?
- Proof of completion: text only, or image upload too?
- Coin reward: fixed tiers or giver-chosen within bounds?
- Group rounds: manual trigger vs. daily scheduled?
- Anthropic API key availability / budget for the demo?
```
