import sys
import os

# Root directory
root_dir = os.path.dirname(os.path.abspath(__file__))
# Backend directory
backend_dir = os.path.join(root_dir, "backend")
sys.path.append(backend_dir)

from app.database import SessionLocal
from app import models
import json

db = SessionLocal()
try:
    latest_campaign = db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).first()

    if latest_campaign:
        print(json.dumps({
            "id": latest_campaign.id,
            "name": latest_campaign.name,
            "calculated_price": latest_campaign.calculated_price,
            "budget": latest_campaign.budget,
            "status": latest_campaign.status.value if hasattr(latest_campaign.status, 'value') else str(latest_campaign.status),
            "advertiser_id": latest_campaign.advertiser_id
        }, indent=2))
    else:
        print("No campaigns found")
finally:
    db.close()
