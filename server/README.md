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

## Demo seed data (local testing)

With `docker compose up`, the API service sets **`SEED_DEMO_DATA=1`**, so on **first startup** (empty DB) it automatically creates demo accounts. No manual `python seed_demo_data.py` is required for Docker.

After the first successful seed you should see a log line: `[SEED_DEMO_DATA] Creating demo accounts …`

| Email | Password | Role |
|-------|----------|------|
| `admin@demo.drishti.dev` | `Demo123!` | Admin |
| `priya@demo.drishti.dev` | `Demo123!` | Contributor |
| `rahul@demo.drishti.dev` | `Demo123!` | User |

If you started the stack **before** this auto-seed existed, the DB may have no demo users: **restart the API container** (`docker compose restart api`) or run the CLI once from your machine (same `DATABASE_URL` as in `.env.example` but host `localhost` instead of `db`):

```bash
cd server
source venv/bin/activate
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/upsc_hindi
export REDIS_URL=redis://localhost:6379/0
python seed_demo_data.py
```

To wipe only demo rows and re-seed:

```bash
python seed_demo_data.py --force
```

Turn off auto-seed in production: set `SEED_DEMO_DATA=0` (or remove it) for the `api` service in `docker-compose.yml`.

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
