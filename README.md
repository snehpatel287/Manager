# Manager

A personal Next.js (App Router) + TypeScript + Tailwind CSS app for managing project entries such as Reddit posts. Data lives in MongoDB, behind a small Node.js + Express API in `server/`.

## Running locally

You need Node 22.9+ and a MongoDB database (local `mongod`, or a free MongoDB Atlas cluster).

```bash
npm install
npm install --prefix server

cp server/.env.example server/.env   # set MONGODB_URI
cp .env.example .env.local           # API_URL defaults to http://localhost:4000

npm run seed       # load data (see below), once
npm run dev:api    # terminal 1: API on http://localhost:4000
npm run dev        # terminal 2: app on http://localhost:3000
```

`npm run seed` imports your old `data/db.json` if it exists, otherwise the sample data in `server/sample-data.json`. You can also pass a file (`npm run seed -- path/to/file.json`). It won't touch a database that already has data unless you add `--reset`, which deletes everything first.

To protect the API when it's hosted, set the same random string as `API_KEY` in both `server/.env` and `.env.local`. Every `/api` request then has to send it in the `x-api-key` header.

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

## API

Express 5 + Mongoose, in `server/src/`. All responses are JSON. Errors look like `{ "error": "..." }`, with status 400 (bad input), 401 (wrong API key) or 404.

| Method & path                                   | Does                                                   |
| ----------------------------------------------- | ------------------------------------------------------ |
| `GET    /health`                                | `{ ok }`: is the database connected (no key needed)    |
| `GET    /api/projects`                          | All projects, each with `stats` (total / live / removed) |
| `POST   /api/projects`                          | Create a project `{ title, description }`, slug is derived from the title |
| `GET    /api/projects/:slug`                    | One project with stats                                 |
| `GET    /api/projects/:slug/entries`            | That project's entries, sorted by `postNo`             |
| `POST   /api/projects/:slug/entries`            | Create an entry, which gets the next `postNo`          |
| `GET    /api/projects/:slug/entries/:postNo`    | One entry by post number                               |
| `GET    /api/entries/:id`                       | One entry by id                                        |
| `PUT    /api/entries/:id`                       | Update any of `postUrl, status, redditUsername, date, subreddit, title, description` |
| `DELETE /api/entries/:id`                       | Delete an entry (204)                                  |
| `POST   /api/entries/:id/status-check`          | Save a Reddit check `{ status: 'live' \| 'removed' \| null, reason, checkedAt }` |

Post numbers come from a counter on each project that is increased in a single database operation, so entries created at the same moment never share a number. Numbers aren't reused after a delete, so an entry's URL never starts pointing at a different entry.

## Structure

```
app/                  Routes (server components) + loading / error / not-found states
  actions.ts          Server Actions: create projects; create / update / delete entries
  globals.css         Tailwind entry
components/           Feature components (client components are marked 'use client')
  ui/                 Primitives: buttonStyles(), inputStyles, Card, FieldLabel, Modal
hooks/useCopy.ts      Clipboard + "Copied!" state
lib/types.ts          Project / Entry types (the shape the API returns)
lib/data/
  api.ts              fetch wrapper for the Express API (adds API_KEY, maps 404 → null)
  projects.ts         Project repository → /api/projects
  entries.ts          Entry repository   → /api/entries, /api/projects/:slug/entries
lib/reddit.ts         Reddit API status checker (server-only)
lib/utils/            Formatting, clipboard, cn() helpers
server/               Express + MongoDB API (its own package.json)
  src/index.js        App setup, starts the server
  src/db.js           Mongoose connection
  src/http.js         API-key check, error handling
  src/models/         Project and Entry schemas
  src/routes/         projects.js, entries.js
  src/seed.js         Imports data/db.json or sample-data.json
```

Data flow: **pages / Server Actions → `lib/data/*` repositories → Express API → MongoDB**. Only the Next server talks to the API, so the browser never sees the API URL or key. Reddit checks still run in Next (where the Reddit credentials are) and save their results through `POST /api/entries/:id/status-check`.

## Resetting data

`npm run seed -- --reset` replaces everything with `data/db.json` (or the sample data if that file is gone).

## Deploying (Vercel)

The app and the API are two Vercel projects made from the same GitHub repo:

1. **API:** in Vercel, **Add New → Project**, pick this repo, set **Root Directory** to `server`, and add the environment variable `MONGODB_URI`. After it deploys, open `https://<api-project>.vercel.app/health`. It should show `{"ok":true}`.
2. **App:** in the existing project, add `API_URL` = the API project's URL (no trailing `/`), then redeploy.
3. **Atlas:** under **Network Access**, allow `0.0.0.0/0`. Vercel has no fixed IP addresses.

To lock the API down, set the same random `API_KEY` in both projects.
