from db.database import engine
from sqlalchemy import text

def run_migrations():
    with engine.connect() as conn:
        # 1. Add account_id to pagos table if not exists
        try:
            conn.execute(text("ALTER TABLE pagos ADD COLUMN account_id VARCHAR(36) NULL;"))
            conn.commit()
            print("Added account_id column to pagos table")
        except Exception as e:
            print("account_id column in pagos may already exist or error:", e)

        # 2. Add detail to tesoro table if not exists
        try:
            conn.execute(text("ALTER TABLE tesoro ADD COLUMN detail VARCHAR(510) NULL;"))
            conn.commit()
            print("Added detail column to tesoro table")
        except Exception as e:
            print("detail column in tesoro may already exist or error:", e)

        # 3. Alter ammount column in tesoro to DOUBLE/FLOAT if needed
        try:
            conn.execute(text("ALTER TABLE tesoro MODIFY COLUMN ammount FLOAT NULL;"))
            conn.commit()
            print("Modified ammount column to FLOAT in tesoro table")
        except Exception as e:
            print("Modify ammount error:", e)

if __name__ == "__main__":
    run_migrations()
