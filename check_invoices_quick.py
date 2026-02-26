"""Quick script to check invoices in the database."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.models import Invoice, Campaign

db = SessionLocal()
try:
    invoices = db.query(Invoice).all()
    print(f"\n{'='*70}")
    print(f"  INVOICE REPORT")
    print(f"{'='*70}")
    print(f"  Total invoices found: {len(invoices)}")
    print(f"{'='*70}\n")
    
    if not invoices:
        print("  No invoices in the database yet.")
        print("  Invoices are generated when a campaign payment is confirmed.\n")
    else:
        for inv in invoices:
            print(f"  Invoice #{inv.invoice_number}")
            print(f"    Campaign ID : {inv.campaign_id}")
            print(f"    Amount      : ${inv.amount:.2f}")
            print(f"    Tax Rate    : {inv.tax_rate}%")
            tax_amount = inv.amount * (inv.tax_rate / 100) if inv.tax_rate else 0
            print(f"    Tax Amount  : ${tax_amount:.2f}")
            print(f"    Total       : ${inv.amount + tax_amount:.2f}")
            print(f"    Status      : {inv.status}")
            print(f"    Due Date    : {inv.due_date}")
            print(f"    Billing Date: {inv.billing_date}")
            print(f"    Created     : {inv.created_at}")
            print(f"  {'-'*60}")
    
    # Also check campaigns
    campaigns = db.query(Campaign).all()
    print(f"\n  Total campaigns: {len(campaigns)}")
    for c in campaigns:
        print(f"    Campaign #{c.id}: {c.name} | Status: {c.status} | Payment: {c.payment_status}")
    print()
finally:
    db.close()
