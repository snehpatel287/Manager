// Static seed data. Shaped like two MongoDB collections (`projects` and
// `entries`) so it maps 1:1 to Mongoose models later. `slug` is the URL key;
// entries reference their project via `projectSlug`.

import type { Entry, Project } from '@/lib/types';

export const projects: Project[] = [
  {
    id: 'p1',
    slug: 'reddit-posts',
    title: 'Reddit Posts',
    description: 'Manage and track Reddit posts across subreddits.',
  },
  {
    id: 'p2',
    slug: 'product-posts',
    title: 'Product Posts',
    description: 'Launch posts and product announcements.',
  },
  {
    id: 'p3',
    slug: 'social-media-posts',
    title: 'Social Media Posts',
    description: 'Posts shared across social platforms.',
  },
];

export const entries: Entry[] = [
  {
    id: '1',
    projectSlug: 'reddit-posts',
    postNo: 1,
    postUrl: 'https://reddit.com/r/webdev/comments/abc123/my_first_post',
    status: 'live',
    redditUsername: 'example_user',
    date: '2026-09-01',
    subreddit: 'r/webdev',
    title: 'What I learned building my first MERN app',
    description:
      'A short write-up on structuring a MERN project so the data layer can be swapped from static data to MongoDB without touching the UI.',
  },
  {
    id: '2',
    projectSlug: 'reddit-posts',
    postNo: 2,
    postUrl: 'https://reddit.com/r/reactjs/comments/def456/router_tips',
    status: 'removed',
    redditUsername: 'example_user',
    date: '2026-09-10',
    subreddit: 'r/reactjs',
    title: 'React Router tips for nested dashboards',
    description: 'Patterns for nested routes, loaders, and keeping URLs shareable.',
  },
  {
    id: '3',
    projectSlug: 'reddit-posts',
    postNo: 3,
    postUrl: 'https://reddit.com/r/node/comments/ghi789/express_structure',
    status: 'live',
    redditUsername: 'dev_notes',
    date: '2026-09-20',
    subreddit: 'r/node',
    title: 'How I structure Express APIs',
    description: 'Routes, controllers, services, and models — a simple layout that scales.',
  },
  {
    id: '4',
    projectSlug: 'product-posts',
    postNo: 1,
    postUrl: 'https://reddit.com/r/SideProject/comments/jkl012/launch',
    status: 'live',
    redditUsername: 'maker_account',
    date: '2026-09-15',
    subreddit: 'r/SideProject',
    title: 'I built a tiny tool to manage my posts',
    description: 'Launch post for the personal post manager.',
  },
];
