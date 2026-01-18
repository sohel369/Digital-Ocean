
from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    try:
        result = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'campaignstatus'"))
        print("CampaignStatus Enum values in DB:")
        for row in result:
            print(f" - {row[0]}")
    except Exception as e:
        print(f"Error: {e}")
