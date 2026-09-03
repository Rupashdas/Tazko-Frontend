![Tazko](.github/banner.svg)

# Tazko — Frontend

![Vue](https://img.shields.io/badge/Vue-3-black) ![Pinia](https://img.shields.io/badge/Pinia-3-black) ![Status](https://img.shields.io/badge/status-in%20build-6366F1) ![License](https://img.shields.io/badge/license-MIT-black)

A Vue 3 single-page app — the front end of Tazko, a task and project management application. The
API is a separate Laravel repo: [tazko](https://github.com/Rupashdas/tazko).

Tazko is in build. What's below describes what exists in this repository today, not a plan.

## What's here

20 views, covering projects, tasks and subtasks, comments, time tracking, roles and permissions,
invitations, and account settings — each with one Pinia store per domain rather than one store
carrying everything.

- **Projects & tasks** — boards, task detail with subtasks, and a comment thread that is the same
  component whether it is attached to a task or a project, because the API treats both the same
  way.
- **Roles** — a role editor against the API's capability system: a role is a chosen set of
  capabilities, not a fixed level.
- **Time tracking**, **invitations**, and **archived projects** as their own views rather than
  folded into the main board.

## Requirements

| | |
|---|---|
| Node | `^20.19.0` or `>=22.12.0` (see `engines` in `package.json`) |
| The API | [tazko](https://github.com/Rupashdas/tazko), running and reachable |

## Setup

```bash
npm install
cp .env.example .env
# set VITE_API_URL to your running API, or leave it for a relative path
npm run dev
```

`npm run build` produces a production build; `npm run preview` serves it locally.

## Stack

Vue 3, Vue Router, Pinia, Tailwind CSS 4, Tiptap (the comment and description editor), Axios. No
UI kit — components here are the site's own.

## License

MIT.
