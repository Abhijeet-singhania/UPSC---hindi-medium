# Drishti — UPSC Hindi Medium Web App

A web application for UPSC CSE aspirants (Hindi medium focus) built with React + Vite.

## Tech Stack

- **React 19** + **Vite 8**
- **Redux Toolkit** — auth state management
- **React Router v7** — client-side routing
- **Tailwind CSS v4** — styling
- **i18next** — EN/HI bilingual support
- **Framer Motion** — animations

## Getting Started

### Prerequisites

- Node.js 18+
- The [backend server](../server/README.md) running (defaults to `http://localhost:8000`)

### Install and run

```bash
cd webApp
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo accounts (after running server seed)

From the [server README](../server/README.md#demo-seed-data-local-testing), run `python seed_demo_data.py`, then sign in on `/auth` with e.g. `priya@demo.drishti.dev` / `Demo123!`.

### Environment Variables

Create a `.env` file in `webApp/`:

```env
# API base URL (no trailing slash)
VITE_API_BASE_URL=http://localhost:8000
```

## Routes

| Path | Page | Auth Required |
|---|---|---|
| `/` | Welcome / Landing | No |
| `/auth` | Login / Register | No |
| `/dashboard` | Dashboard (stats + leaderboard) | Yes |
| `/roadmap` | Study Roadmap | Yes |
| `/content` | Study Content | Yes |
| `/affairs` | Current Affairs | Yes |
| `/prelims` | Prelims Lab (MCQ practice) | Yes |
| `/past-year` | Past Year Problems vault | Yes |
| `/answers` | Daily Answer Writing | Yes |
| `/ask-ai` | AI Mentor chat | Yes |
| `/rewards` | Ranks & Rewards | Yes |
| `/community` | Community Q&A | Yes |
| `/wellbeing` | Wellbeing tracker | Yes |
| `/settings` | Profile & Preferences | Yes |

## Key Features

- **Auth** — JWT login/register with profile hydration
- **Past Year Problems** — live search + filter from server
- **Prelims Lab** — real PYQ-driven MCQ practice with answer tracking
- **Community Q&A** — post questions, write answers, vote, leaderboard
- **Answer Writing** — daily UPSC-style answer writing practice
- **Dashboard** — real reputation, streak, study stats
- **Settings** — persistent profile save via API
- **Bilingual** — full EN/HI i18n support
- **Themes** — dark/light mode persisted

## Build

```bash
npm run build
npm run preview
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
