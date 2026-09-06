<div align="center">

# CampusX

**A gamified placement & learning platform for college students.**

[![Next.js](https://img.shields.io/badge/Next.js-13.5-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

Level up your skills. Land your dream job.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Docker](#-docker-deployment) · [Docs](#-api-documentation)

</div>

---

## Overview

CampusX gamifies the placement journey for college students. It combines
personalized roadmaps, skill tracking with XP and levels, project portfolios,
AI-powered mock interviews, resume intelligence, and a competitive nationwide
leaderboard — all in one place. Students stay motivated with daily streaks,
badges, and a clear path from fundamentals to interview-ready.

## Features

- **Skill Tracking** — Gamified skill tree with XP, levels, and proficiency
  badges across 50+ technical skills.
- **Personalized Roadmaps** — Step-by-step learning paths from fundamentals to
  interview-ready, adapted to your pace and target role.
- **Project Portfolio** — Build real-world projects with guided templates,
  track progress, and showcase your work with GitHub analysis.
- **Mock Interviews** — AI-powered mock interviews for technical, HR, and
  system design rounds with instant feedback and scoring.
- **Resume Intelligence** — Upload your resume for AI-driven analysis, skill
  extraction, and placement-ready optimization suggestions.
- **Leaderboard** — Compete with students nationwide. Climb ranks, earn
  badges, and stay motivated.
- **Placement Drives** — Track company drives, eligibility, deadlines, and
  application status — all in one place.
- **Community & Mentorship** — Connect with peers and mentors for guidance.
- **Notifications** — Stay on top of deadlines, drive reminders, and streaks.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 13.5 (App Router, standalone output) |
| UI | React 18, Tailwind CSS 3.3, shadcn/ui, Radix UI, lucide-react |
| Language | TypeScript 5.2 |
| Database & Auth | Supabase (Postgres, RLS, Auth) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Containerization | Docker, Docker Compose |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                             │
│                                                                            │
│  Next.js App Router (React 18, Tailwind, shadcn/ui)                        │
│  ├── Landing / Auth (login, register)                                     │
│  └── Dashboard (skills, roadmaps, projects, interviews, placements,       │
│        resume, leaderboard, community, notifications)                     │
└───────────────┬──────────────────────────────────────┬───────────────────┘
                │                                      │
                │  Supabase JS client (anon key)        │  fetch() to Edge
                │  ─ data reads/writes (RLS-enforced)   │  Functions (JWT)
                ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Supabase Platform                                 │
│                                                                            │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────────────────┐  │
│  │  Postgres   │   │      Auth        │   │     Edge Functions (Deno)  │  │
│  │             │   │  (email/pass,    │   │                            │  │
│  │  Tables +   │   │   sessions,      │   │  • ai-engine               │  │
│  │  RLS        │   │   onAuthState…)  │   │  • analyze-repo            │  │
│  │             │   │                  │   │  • analyze-resume          │  │
│  └──────┬──────┘   └──────────────────┘   │  • mock-interview          │  │
│         │                                 └─────────────┬──────────────┘  │
│         │  service_role key (server-only)                │                 │
│         └─────────────────────────────────────────────────┘                 │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key principle:** the browser talks straight to Postgres via the Supabase JS
client using the anon key; Row Level Security (RLS) policies enforce
per-user access control. Edge Functions use the `service_role` key
(server-only) for privileged operations and are protected by JWT verification.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9 (or pnpm / yarn — examples use npm)
- A **Supabase** project (free tier is fine) — create one at
  [supabase.com](https://supabase.com)
- **Docker** + **Docker Compose** (only for containerized deployment)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url> campusx
cd campusx

# 2. Install dependencies
npm install
```

### Environment Setup

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Open `.env` and set the following (see [`.env.example`](./.env.example) for
detailed notes):

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key (safe for the browser; RLS enforces access). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Supabase service role key — bypasses RLS. **Never** prefix with `NEXT_PUBLIC_` or import from a client component. |
| `GITHUB_TOKEN` | Optional | Used by the `analyze-repo` edge function to raise GitHub's unauthenticated rate limit. Set as an Edge Function secret in the Supabase dashboard. |

> **Security:** `NEXT_PUBLIC_*` vars are inlined into the client bundle at
> build time and are visible to anyone. `SUPABASE_SERVICE_ROLE_KEY` must
> never be exposed to the browser.

## Development

```bash
# Start the dev server (http://localhost:3000)
npm run dev

# Type-check
npm run typecheck

# Lint
npm run lint

# Production build (standalone output)
npm run build

# Start the production server
npm start
```

The app uses a **dark theme by default** with a class-based toggle
(`next-themes`). Toggle between dark/light via the theme button in the header.

## Database Setup (Supabase Migrations)

The SQL migrations live in [`supabase/migrations/`](./supabase/migrations).
Apply them in order using the Supabase CLI or the Supabase MCP tooling:

```bash
# Option A — Supabase CLI (linked project)
supabase db push

# Option B — apply each migration manually in the Supabase SQL Editor
```

Migrations (applied in timestamp order):

| Migration | Purpose |
| --- | --- |
| `20260818213325_create_profiles_and_prep_tables` | User profiles & prep foundation |
| `20260818214632_add_assessment_questions_and_seed` | Assessment questions + seed data |
| `20260819172504_add_gamification_engine` | XP, levels, badges, streaks |
| `20260819173346_add_career_roadmaps` | Career roadmaps & target roles |
| `20260820185848_add_learning_module` | Learning modules & content |
| `20260820190350_add_projects_module` | Projects catalog |
| `20260823173237_add_project_verifications` | Project submission verification |
| `20260823175029_add_resume_intelligence` | Resume parsing & analysis |
| `20260903150612_add_interview_preparation` | Interview questions & sessions |
| `20260903153524_add_community_mentorship_leaderboard` | Community, mentors, leaderboard |
| `20260904114718_add_placement_ecosystem` | Placement drives & applications |
| `20260904120935_add_notifications_system` | In-app notifications |
| `20260905034748_security_hardening` | RLS hardening & access control |

## Edge Functions Deployment

Edge functions live in [`supabase/functions/`](./supabase/functions) and run on
the Deno runtime. They are configured in [`supabase/config.toml`](./supabase/config.toml)
with `verify_jwt = true` (require a valid Supabase JWT).

Deploy via the Supabase MCP `deploy_edge_functions` tool (deploys all changed
functions in one call), or via the CLI:

```bash
# Supabase CLI (linked project)
supabase functions deploy ai-engine
supabase functions deploy analyze-repo
supabase functions deploy analyze-resume
supabase functions deploy mock-interview
```

### Edge Function Secrets

Set these as Edge Function secrets in the Supabase dashboard
(Project Settings → Edge Functions → Secrets) — **not** in the Next.js `.env`:

| Secret | Used by | Required |
| --- | --- | --- |
| `SUPABASE_URL` | All functions | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions | Yes |
| `GITHUB_TOKEN` | `analyze-repo` | Optional (raises GitHub rate limit) |

## Docker Deployment

### Build & run with Docker Compose

```bash
# 1. Ensure .env is present and filled in (see Environment Setup)
cp .env.example .env
# edit .env ...

# 2. Build and start
docker compose up --build -d

# 3. Visit http://localhost:3000
docker compose logs -f app
```

The compose file:
- Builds the app from the multi-stage `Dockerfile` (node:18-alpine).
- Forwards `NEXT_PUBLIC_*` build args so public vars are inlined into the
  client bundle at build time.
- Injects `SUPABASE_SERVICE_ROLE_KEY` at runtime (server-only, never baked
  into the image).
- Maps port `3000` and persists the `.next` cache in a named volume
  (`.next_cache`) for faster rebuilds.
- Runs as a non-root user inside the container.

### Build & run with plain Docker

```bash
# Build (pass public env vars as build args so they land in the client bundle)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t campusx .

# Run (server-only secrets injected at runtime)
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  campusx
```

## Project Structure

```
campusx/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (providers, theme, toaster)
│   ├── page.tsx              # Landing page
│   ├── error.tsx             # Global error boundary
│   ├── not-found.tsx         # Custom 404
│   ├── globals.css           # Tailwind + theme tokens (dark default)
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   └── dashboard/            # Authenticated app shell + feature routes
├── components/
│   ├── ui/                   # shadcn/ui primitives (button, card, badge, …)
│   ├── dashboard/            # Dashboard-specific components & providers
│   ├── auth-provider.tsx     # Supabase auth context
│   ├── theme-provider.tsx    # next-themes provider
│   └── theme-toggle.tsx      # Dark/light toggle
├── lib/
│   ├── supabase/client.ts    # Browser Supabase client (anon key)
│   ├── ai/                   # AI service helpers (edge function calls)
│   ├── interview/            # Mock interview data layer
│   ├── placements/           # Placement drive logic
│   ├── projects/             # Project + GitHub analysis
│   ├── resume/               # Resume intelligence
│   ├── skills/               # Skill tree logic
│   ├── roadmaps/             # Roadmap logic
│   ├── community/            # Community & mentorship
│   ├── notifications/        # Notifications logic
│   ├── gamification/         # XP, levels, badges
│   └── utils.ts              # Shared utilities (cn, etc.)
├── supabase/
│   ├── config.toml           # Edge function config (verify_jwt)
│   ├── functions/            # Deno edge functions
│   │   ├── ai-engine/
│   │   ├── analyze-repo/
│   │   ├── analyze-resume/
│   │   └── mock-interview/
│   └── migrations/           # SQL migrations (timestamp-ordered)
├── hooks/                    # React hooks
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # Full-stack compose (app + env + volumes)
├── .dockerignore
├── .env.example              # Documented env var template
├── next.config.js            # Next.js config (output: 'standalone')
├── tailwind.config.ts        # Tailwind theme (dark-mode: class)
└── package.json
```

## API Documentation (Edge Functions)

All edge functions are served at
`https://<project-ref>.supabase.co/functions/v1/<slug>` and require a valid
Supabase JWT in the `Authorization: Bearer <token>` header (`verify_jwt = true`).
They accept `POST` with a JSON body and return JSON.

### `ai-engine`

Semantic skill matching, roadmap recommendations, and project recommendations.

```http
POST /functions/v1/ai-engine
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{ "action": "recommend_roadmaps", "user_skills": [...], "target_role": "..." }
```

**Actions:** `recommend_roadmaps`, `recommend_projects`, `match_jobs`

### `analyze-repo`

Analyzes a GitHub repository, extracts skills/tech stack, and links it to a
user's project submission.

```http
POST /functions/v1/analyze-repo
{ "repo_url": "https://github.com/user/repo", "user_id": "..." }
```

**Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN` (optional)

### `analyze-resume`

Parses an uploaded resume, extracts skills and experience, and returns
placement-readiness suggestions.

```http
POST /functions/v1/analyze-resume
{ "resume_url": "...", "user_id": "..." }
```

### `mock-interview`

Runs AI-powered mock interviews: selects role-relevant questions and evaluates
answers with feedback and scoring across technical depth, relevance, clarity,
and communication.

```http
POST /functions/v1/mock-interview
{ "action": "start", "category": "technical", "target_role": "...", "user_id": "..." }

POST /functions/v1/mock-interview
{ "action": "evaluate", "questions": [...], "answers": [...], "user_id": "..." }
```

**Actions:** `start` (returns selected questions), `evaluate` (returns scored feedback)

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create your branch from `main`.
2. **Install** dependencies: `npm install`.
3. **Develop** against the dark theme default; use existing UI primitives from
   `@/components/ui/` and lucide-react icons.
4. **Lint & type-check** before opening a PR:
   ```bash
   npm run lint && npm run typecheck
   ```
5. **Migrations:** if your change touches the schema, add a new timestamped
   migration under `supabase/migrations/` — never edit an applied migration.
6. **Edge functions:** add new functions under `supabase/functions/<slug>/` and
   register them in `supabase/config.toml` with `verify_jwt = true` unless the
   function is a public webhook.
7. **Security:** never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser, and
   never prefix a server-only secret with `NEXT_PUBLIC_`.
8. Open a **pull request** with a clear description of the change.

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE)
for details.

---

<div align="center">

&copy; 2026 CampusX. All rights reserved.

</div>
