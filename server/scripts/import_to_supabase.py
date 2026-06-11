#!/usr/bin/env python3
"""Import a pg_dump --data-only SQL file into the DB configured in DATABASE_URL."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from sqlalchemy.engine import make_url

from app.config import settings


def main() -> None:
    sql_path = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/upsc_data.sql")
    if not sql_path.exists():
        raise SystemExit(f"File not found: {sql_path}")

    url = make_url(settings.DATABASE_URL)
    query = dict(url.query) if url.query else {}
    sslmode = query.get("sslmode", "require")

    env = {
        "PGHOST": url.host or "",
        "PGPORT": str(url.port or 5432),
        "PGUSER": url.username or "",
        "PGPASSWORD": url.password or "",
        "PGDATABASE": url.database or "postgres",
        "PGSSLMODE": sslmode,
    }

    print(f"Importing {sql_path} → {env['PGHOST']}:{env['PGPORT']}/{env['PGDATABASE']}")

    for cmd in (
        ["psql", "-v", "ON_ERROR_STOP=1", "-c", "SET session_replication_role = 'replica';"],
        ["psql", "-v", "ON_ERROR_STOP=1", "-f", str(sql_path)],
        ["psql", "-v", "ON_ERROR_STOP=1", "-c", "SET session_replication_role = 'origin';"],
    ):
        subprocess.run(cmd, env=env, check=True)

    print("Import complete.")


if __name__ == "__main__":
    main()
