# Manager

A personal Next.js (App Router) + TypeScript + Tailwind CSS app for managing project entries such as Reddit posts. Data lives in MongoDB (via Mongoose), read and written directly by the Next.js server.

## Running locally

You need Node 22.9+ and a MongoDB database (a free MongoDB Atlas cluster, or local `mongod`).

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI
npm run seed                 # load data (see below), once
npm run dev                  # http://localhost:3000
```

`npm run seed` imports your old `data/db.json` if it exists, otherwise the sample data in `scripts/sample-data.json`. You can also pass a file (`npm run seed -- path/to/file.json`). It won't touch a database that already has data unless you add `--reset`, which deletes everything first.

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
| `/:projectSlug/:postNo`   | Entry details (e.g. `/reddit-posts/1` = Post #1): copy fields, Copy All, Edit, Delete |

## Data

MongoDB, through Mongoose, straight from the Next.js server (Server Components and Server Actions). There's no separate backend. Two collections:

- `projects`: `slug` (unique, used in URLs), `title`, `description`, `lastPostNo`
- `entries`: `projectSlug`, `postNo` (unique per project), `postUrl`, `status`, `redditUsername`, `date`, `subreddit`, `title`, `description`, `lastCheckedAt`, `statusReason`

Post numbers come from `lastPostNo` on the project, which is increased in a single database operation, so entries created at the same moment never share a number. Numbers aren't reused after a delete, so an entry's URL never starts pointing at a different entry. Deleting a project deletes its entries. Setting a status by hand sets its reason to "Set manually".

## Structure

```
app/                  Routes (server components) + loading / error / not-found states
  actions.ts          Server Actions: create projects; create / update / delete entries
  globals.css         Tailwind entry
components/           Feature components (client components are marked 'use client')
  ui/                 Primitives: buttonStyles(), inputStyles, Card, FieldLabel, Modal
hooks/useCopy.ts      Clipboard + "Copied!" state
lib/types.ts          Project / Entry types
lib/db/
  connect.ts          Cached Mongoose connection (MONGODB_URI)
  models.ts           Project and Entry schemas
lib/data/
  projects.ts         Project queries (list with stats, create, update, delete)
  entries.ts          Entry queries (list, create, update, delete, save status check)
lib/reddit.ts         Reddit API status checker (server-only)
lib/utils/            Formatting, clipboard, cn() helpers
scripts/seed.mjs      Imports data/db.json or sample-data.json into MongoDB
```

Data flow: **pages / Server Actions → `lib/data/*` → MongoDB**. The UI only talks to `lib/data`, and database code never reaches the browser.

## Resetting data

`npm run seed -- --reset` replaces everything with `data/db.json` (or the sample data if that file is gone).

## Deploying (Vercel)

1. In the Vercel project, go to **Settings → Environment Variables** and add `MONGODB_URI` (plus the Reddit variables if you use status checks), then redeploy.
2. In MongoDB Atlas, go to **Network Access** and allow `0.0.0.0/0`, because Vercel has no fixed IP addresses.
