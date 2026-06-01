# Drishti — Backend Server

FastAPI backend for the UPSC Hindi Medium peer learning platform.

## Tech Stack

- **FastAPI 0.109** + **Uvicorn**
- **SQLAlchemy 2.0** ORM with **PostgreSQL**
- **Redis** — leaderboard caching
- **Pydantic v2** — data validation
- **python-jose** — JWT authentication
- **Alembic** — database migrations
- **Docker Compose** — local dev environment

## Quick Start (Docker)

```bash
cd server
cp .env.example .env          # edit SECRET_KEY and other values
docker compose up --build
```

API will be available at `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

## Content seeding (demo vs. production)

By default `SEED_DEMO_DATA=0` and `SEED_STARTER_PYQ` is unset — the database starts clean with zero sample content.

To create demo accounts on first run (local testing only), set `SEED_DEMO_DATA=1` in `docker-compose.yml` or `.env`.

| Email | Password | Role |
|-------|----------|------|
| `admin@demo.drishti.dev` | `Demo123!` | Admin |
| `priya@demo.drishti.dev` | `Demo123!` | Contributor |
| `rahul@demo.drishti.dev` | `Demo123!` | User |

To seed a small set of sample PYQ questions, set `SEED_STARTER_PYQ=1`.

## Wiping sample content (keep user accounts)

Run once after you no longer need demo data:

```bash
# From inside the server/ directory (with DB + Redis running):
docker compose exec api python wipe_content.py           # dry run — shows counts
docker compose exec api python wipe_content.py --confirm # actually deletes

# Also wipe silent library sessions:
docker compose exec api python wipe_content.py --confirm --include-sessions
```

Then restart the API: `docker compose restart api`

> **Nuclear option:** `docker compose down -v` wipes the entire Postgres volume (you lose all users too).

## Admin account setup

After wiping, promote your own account to admin via psql if needed:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## MVP Verification Checklist

After wipe + restart, verify the full flow:

1. **Clean slate** — DB has users but zero CA/PYQ/daily Q/community content.
2. **CA ingest & publish** — Admin → Jobs → Trigger Ingestion → wait ~30s → Admin → Current Affairs → Drafts → Publish one → visit `/affairs` → item appears → click title → detail page opens.
3. **Daily question rotation** — Admin → Daily Questions → New Question (date = today) → Admin → Jobs → Rotate → navigate to `/answers` → new question title visible.
4. **Dashboard live** — `/dashboard` shows real CA items, today's question teaser, and clickable plan tasks.
5. **Community** — Post a question, write an answer, upvote.
6. **Wellbeing** — Join silent library, study 2 min, leave → stats increment. Switch tab during session → warning banner (no auto-leave).
7. **Prelims** — Browse PYQ you added; start a Prelims mock test; complete → XP awarded.

## Quick Start (Local with venv)

```bash
cd server
~/.pyenv/versions/3.12.13/bin/python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/upsc_hindi
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=your-secret-key-here

uvicorn app.main:app --reload
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | postgres://...@db/upsc_hindi | PostgreSQL connection URL |
| `REDIS_URL` | No | redis://redis:6379/0 | Redis connection URL |
| `SECRET_KEY` | **Yes** | `SPARTA` ⚠️ | JWT signing secret (change in production!) |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |

## API Routes

| Prefix | Module | Description |
|---|---|---|
| `/api/v1/users` | users.py | Auth (register, login), profile CRUD |
| `/api/v1/questions` | questions.py | Community Q&A questions |
| `/api/v1/answers` | answers.py | Answers + voting |
| `/api/v1/daily` | daily_answer.py | Daily answer writing practice |
| `/api/v1/past-year-problems` | past_year_problems.py | PYQ vault |
| `/api/v1/leaderboard` | leaderboard.py | Reputation leaderboards (Redis) |
| `/api/v1/silent-library` | silent_library.py | Study session tracking |
| `/api/v1/reports` | reports.py | Content moderation reports |

## Database Migrations (Alembic)

```bash
# First time on an existing DB (created via create_all):
alembic stamp head

# For future schema changes:
alembic revision --autogenerate -m "describe_change"
alembic upgrade head

# Rollback one step:
alembic downgrade -1
```

## Security Notes

- Set `SECRET_KEY` to a long random string in production (`openssl rand -hex 32`)
- Set `ALLOWED_ORIGINS` to your frontend domain(s) — do NOT use `*` in production
- Admin endpoints require a valid JWT token from a user with `admin` or `moderator` role
