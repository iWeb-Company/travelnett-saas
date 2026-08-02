from db.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE reservation_passengers ADD COLUMN lugar_carga_id VARCHAR(36) NULL;"))
            conn.commit()
            print("Successfully added lugar_carga_id column to reservation_passengers table")
        except Exception as e:
            print("lugar_carga_id column may already exist or error:", e)

if __name__ == "__main__":
    run_migration()
