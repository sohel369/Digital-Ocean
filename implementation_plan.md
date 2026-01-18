# Pricing Cleanup Implementation Plan

## Problem Analysis
The current campaign creation flow presents mixed signals to the user:
1.  **Confusing Terminology**: "Pay As You Go" badge appears next to a fixed-price calculation.
2.  **Inconsistent Naming**: The form uses "Budget" for what is actually a fixed "Campaign Cost".
3.  **Code Duplication**: Duration discounts (5/10/15%) are hardcoded in both frontend (`CampaignCreation.jsx`) and backend (`pricing.py`).

## Goals
- Eliminate "Pay As You Go" terminology to reinforce the fixed-monthly usage model.
- Rename "Budget" references to "Price" or "Campaign Cost".
- Ensure duration discount logic is clear and consistent.

## Implementation Steps

### 1. Frontend Cleanup (`src/pages/CampaignCreation.jsx`)
- **Remove Badge**: Delete the "Pay As You Go" badge from the pricing section.
- **Rename Section**: Change "4. Budget & Pricing" to "4. Campaign Cost".
- **Update Labels**: Rename "Budget" input label to "Total Campaign Cost (Fixed)".
- **Verify Logic**: Add comments to the duration discount logic linking it to the backend `PricingEngine` rules to prevent drift.

### 2. Backend Verification (`backend/app/pricing.py`)
- Confirmed that backend uses the same 5%/10%/15% tiers for 3/6/12 month durations.
- No code changes required on backend, but we will document this coupling.

### 3. Localization Consideration
- Ensure all new labels use translation keys (`t('campaign.cost')` instead of hardcoded strings).

## Outcome
A user interface that clearly communicates a fixed-term, fixed-price advertising model without misleading "pay-as-you-go" elements.
