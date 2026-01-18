# Localization Completeness Checklist

## 1. Missing Languages (Critical)
The `src/config/i18nConfig.js` lists the following languages as enabled, but they are **MISSING** from `src/config/translations.js`:
- [ ] **German (de)**
- [ ] **Spanish (es)**
- [ ] **Indonesian (id)**
- [ ] **Italian (it)**

**Action:** Create translation blocks for these languages. Until then, they will fallback to English or break the UI.

## 2. Japanese Language Update
- [ ] **Japanese (ja)** exists in the file but was not updated with the latest Pricing Cleanup keys (`cost_title`, `total_cost_fixed`, `monthly_rate`).
  - **Action:** Add the following keys to the `ja` block:
    ```javascript
    cost_title: "キャンペーン費用",
    total_cost_fixed: "キャンペーン総費用 (固定)",
    cost_note: "固定価格には、すべての広告配信費用とプラットフォーム手数料が含まれています。",
    monthly_rate: "月額基本料金"
    ```

## 3. Translation Consistency
Ensure the following keys are present in **ALL** languages:
- [ ] `campaign.cost_title`
- [ ] `campaign.total_cost_fixed`
- [ ] `campaign.cost_note`
- [ ] `campaign.monthly_rate`
- [ ] `admin.density_multi`
- [ ] `geo.coverage_area`

## 4. Currency & Formatting
- [ ] **Exchange Rates:** `EXCHANGE_RATES` in `i18nConfig.js` are hardcoded mocks.
  - **Action:** Implement live fetching or scheduled updates for exchange rates to prevent pricing drift.
- [ ] **Currency Support:** Verify `Intl.NumberFormat` support for `VND` (Dong) and `IDR` (Rupiah) which typically have no decimal places (set to 0 in config, verify behavior).

## 5. UI/UX Verification
- [ ] **Text Overflow:** Check if long German or French strings break the layout in the Campaign Creation cards.
- [ ] **RTL Support:** If Arabic or Hebrew are added later, ensure `dir="rtl"` is supported. (Current languages are all LTR).
- [ ] **Fonts:** Verify the current font supports Thai and Japanese characters natively without fallback issues.

## 6. Backend Alignment
- [ ] **Pricing Logic:** The frontend hardcodes discount tiers (5%/10%/15%). Ensure `backend/app/pricing.py` logic remains exactly synchronized.
  - *Current Status:* Logic matches (3mo=5%, 6mo=10%, 12mo=15%), but they are decoupled.
  - **Recommendation:** Fetch these tiers from the `/pricing/config` endpoint instead of hardcoding in JSX. (See `pricingData.discounts` usage).

## 7. Dynamic Data Translation
- [ ] **Industry Names:** The backend returns English industry names (`Retail`, `Healthcare`).
  - **Action:** Ensure `formatIndustryName` helper maps these backend values to `translations.js` keys (e.g., `t('industry.retail')`) before displaying.
  - *Current Status:* Partially implemented in `CampaignCreation.jsx` (Line 153). Verify coverage for all industries.
