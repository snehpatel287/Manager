# Manager

A personal Next.js (App Router) + TypeScript + Tailwind CSS app for managing project entries such as Reddit posts. It runs on static mock data for now and is set up so MongoDB can be added later.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Checking if Reddit posts are live

**Check statuses** (project page) and **Check on Reddit** (entry page) ask Reddit whether each post can be seen publicly, then update its Live/Removed badge. Each entry also stores the reason ("Removed by moderators", "Filtered by AutoModerator", "Deleted by author", …) and when it was last checked. Hover a badge in the table to see the reason.

Reddit blocks requests that aren't logged in, so this uses the official API (free for personal use):

1. Log in to Reddit and open https://www.reddit.com/prefs/apps, then click **create another app…**
2. Choose **script** as the type. Any redirect URI works (e.g. `http://localhost:3000`).
3. `cp .env.example .env.local`, then paste the client ID (the string under the app name) and the secret.
4. Restart `npm run dev`.

Checks look at posts the way a logged-out visitor sees them, so posts removed quietly by moderators or the spam filter show as removed even though they still look live to you when logged in. Up to 100 posts are checked per API request. The code is in `lib/reddit.ts`.

## Routes

| Route                     | Page                                       |
| ------------------------- | ------------------------------------------ |
| `/`                       | Project cards with stats + "Add Project"   |
| `/:projectSlug`           | Entries table + "Add New Entry"            |
| `/:projectSlug/new`       | Add-entry form                             |
| `/:projectSlug/:entryId`  | Entry details: copy fields, Copy All, Edit, Delete |

## Structure

```
app/                  Routes (server components) + loading / error / not-found states
  actions.ts          Server Actions: create projects; create / update / delete entries
  globals.css         Tailwind entry
components/           Feature components (client components are marked 'use client')
  ui/                 Primitives: buttonStyles(), inputStyles, Card, FieldLabel, Modal
hooks/useCopy.ts      Clipboard + "Copied!" state
lib/types.ts          Project / Entry types (future Mongoose model shape)
lib/data/
  mockData.ts         Seed data (shaped like `projects` and `entries` collections)
  store.ts            In-memory store (resets on server restart)
  projects.ts         Project repository  ← swap for Mongoose
  entries.ts          Entry repository    ← swap for Mongoose
lib/reddit.ts         Reddit API status checker (server-only)
lib/utils/            Formatting, clipboard, cn() helpers
```

Data flow: **pages / Server Actions → `lib/data/*` repositories → store**. The UI only talks to the repositories, so these are the only files that change.

## Adding MongoDB later

1. `npm install mongoose`, then add `MONGODB_URI` to `.env.local`.
2. Add `lib/db.ts` (a cached connection) and `models/Project.ts` and `models/Entry.ts`, typed from `lib/types.ts`.
3. Replace the function bodies in `lib/data/projects.ts` and `lib/data/entries.ts` with Mongoose queries. Each function is commented with the REST endpoint it matches. Delete `store.ts`.
4. Optional: to get the REST API (`GET /api/projects`, `PUT /api/entries/:entryId`, and so on), add route handlers under `app/api/...` that call the same repository functions.
