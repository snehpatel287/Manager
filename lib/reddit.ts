// Reddit status checker (server-only). Uses Reddit's OAuth API with an
// app-only token, which sees posts the way a logged-out visitor does — so
// silent removals (mods, AutoModerator, spam filter) are detected even though
// the author still sees the post when logged in.
//
// Requires a Reddit "script" app: https://www.reddit.com/prefs/apps
// and REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET in .env.local.

import type { EntryStatus } from '@/lib/types';

export interface RedditCheckResult {
  /** null when the status couldn't be determined (bad link, private sub, …) */
  status: EntryStatus | null;
  reason: string;
}

export class RedditConfigError extends Error {}

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const API_BASE = 'https://oauth.reddit.com';
const BATCH_SIZE = 100; // /api/info accepts up to 100 ids per call

const userAgent = () => process.env.REDDIT_USER_AGENT || 'web:personal-post-manager:0.1';

// ---------------------------------------------------------------- URL parsing

/** Extracts the base36 post id from common Reddit link formats. */
export function parsePostId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'redd.it') {
    return parsed.pathname.match(/^\/([a-z0-9]+)/i)?.[1]?.toLowerCase() ?? null;
  }
  if (host !== 'reddit.com' && !host.endsWith('.reddit.com')) return null;
  return parsed.pathname.match(/\/comments\/([a-z0-9]+)/i)?.[1]?.toLowerCase() ?? null;
}

const isShareLink = (url: string) => /reddit\.com\/r\/[^/]+\/s\/[a-z0-9]+/i.test(url);

// ------------------------------------------------------------ classification

interface RedditPost {
  id: string;
  author?: string;
  selftext?: string;
  removed_by_category?: string | null;
}

const REMOVAL_REASONS: Record<string, string> = {
  moderator: 'Removed by moderators',
  automod_filtered: 'Filtered by AutoModerator',
  reddit: 'Removed by Reddit (spam filter)',
  anti_evil_ops: 'Removed by Reddit admins',
  community_ops: 'Removed by Reddit community team',
  content_takedown: 'Removed by Reddit (content policy)',
  copyright_takedown: 'Removed for copyright',
  legal_takedown: 'Removed for legal reasons',
  author: 'Deleted by author',
  deleted: 'Deleted by author',
};

export function classifyPost(post: RedditPost): RedditCheckResult {
  const category = post.removed_by_category;
  if (category) {
    return { status: 'removed', reason: REMOVAL_REASONS[category] ?? `Removed (${category})` };
  }
  if (post.selftext === '[removed]') return { status: 'removed', reason: 'Removed' };
  if (post.selftext === '[deleted]' || post.author === '[deleted]') {
    return { status: 'removed', reason: 'Deleted' };
  }
  return { status: 'live', reason: 'Visible publicly' };
}

// ----------------------------------------------------------------- API calls

type TokenCache = { token: string; expiresAt: number };
const cache = globalThis as typeof globalThis & { __redditToken?: TokenCache };

async function getAccessToken(): Promise<string> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) {
    throw new RedditConfigError(
      'Reddit API is not configured. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env.local (see README).',
    );
  }

  const cached = cache.__redditToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent(),
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !data.access_token) {
    throw new RedditConfigError(`Reddit rejected the credentials (HTTP ${res.status}). Check your client ID/secret.`);
  }

  cache.__redditToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function redditGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': userAgent() },
    cache: 'no-store',
  });
  if (res.status === 429) throw new Error('Reddit rate limit hit — try again in a minute.');
  if (!res.ok) throw new Error(`Reddit API error (HTTP ${res.status})`);
  return res.json() as Promise<T>;
}

/** Follows a /r/sub/s/xxxx share link to its real /comments/ URL. */
async function resolveShareLink(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': userAgent() },
      cache: 'no-store',
    });
    return res.headers.get('location');
  } catch {
    return null;
  }
}

/**
 * Checks many post URLs at once. Returns one result per input URL, in order.
 * Throws RedditConfigError if credentials are missing/invalid.
 */
export async function checkRedditPosts(urls: string[]): Promise<RedditCheckResult[]> {
  const token = await getAccessToken();

  const ids = await Promise.all(
    urls.map(async (url) => {
      const direct = parsePostId(url);
      if (direct || !isShareLink(url)) return direct;
      const resolved = await resolveShareLink(url);
      return resolved ? parsePostId(resolved) : null;
    }),
  );

  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  const posts = new Map<string, RedditPost>();
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE).map((id) => `t3_${id}`);
    const res = await redditGet<{ data: { children: { data: RedditPost }[] } }>(
      `/api/info?id=${batch.join(',')}&raw_json=1`,
      token,
    );
    for (const child of res.data.children) posts.set(child.data.id, child.data);
  }

  return ids.map((id, i) => {
    if (!urls[i]?.trim()) return { status: null, reason: 'No post URL' };
    if (!id) {
      return {
        status: null,
        reason: isShareLink(urls[i]) ? 'Could not resolve share link — use the full post URL' : 'Not a Reddit post link',
      };
    }
    const post = posts.get(id);
    // /api/info still returns removed posts; a missing one means it's gone
    // entirely or the subreddit is private/banned.
    if (!post) return { status: 'removed', reason: 'Post not found (deleted or subreddit private/banned)' };
    return classifyPost(post);
  });
}
