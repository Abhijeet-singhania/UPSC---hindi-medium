#!/usr/bin/env python3
"""
CLI to load demo data (same logic as Docker SEED_DEMO_DATA startup).

  python seed_demo_data.py
  python seed_demo_data.py --force

See app/seeds/demo_data.py and server/README.md.
"""

from __future__ import annotations

import argparse
import sys

if __name__ == "__main__":
    sys.path.insert(0, ".")

from app.db import models  # noqa: E402
from app.db.database import SessionLocal, engine  # noqa: E402
from app.db.models import User  # noqa: E402
from app.seeds.demo_data import (  # noqa: E402
    DEMO_EMAIL_DOMAIN,
    DEMO_PASSWORD,
    admin_demo_email,
    clear_demo_users_for_cli,
    demo_emails,
    seed_demo_data,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo data for UPSC Hindi API.")
    parser.add_argument(
        "--force",
        action="store_true",
        help=f"Remove users with emails *{DEMO_EMAIL_DOMAIN} and related rows, then seed again.",
    )
    args = parser.parse_args()

    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_demo_email()).first()
        if existing and not args.force:
            print("Demo data already present. Use --force to reset.")
            return
        if args.force:
            print("Removing previous demo users and related data...")
            clear_demo_users_for_cli(db)
        print("Seeding demo data…")
        seed_demo_data(db)
        print("Done.\nLog in with:")
        for em in demo_emails():
            print(f"  {em} / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
