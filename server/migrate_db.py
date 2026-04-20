from sqlalchemy import text
from app.db.database import engine

def migrate():
    with engine.connect() as conn:
        print("Starting migration...")
        try:
            # Add email column
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)"))
            # Add hashed_password column
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255)"))
            # Create index for email
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"))
            conn.commit()
            print("Migration successful: Added email and hashed_password columns.")
        except Exception as e:
            print(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
