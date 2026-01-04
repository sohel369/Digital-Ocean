/**
 * Internationalization Configuration
 * Supports 11 countries, 10 currencies, and 9 languages
 */

export const SUPPORTED_COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', language: 'en', timezone: 'America/New_York', enabled: true },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', language: 'en', timezone: 'Europe/London', enabled: true },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', language: 'en', timezone: 'America/Toronto', enabled: true },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', language: 'en', timezone: 'Australia/Sydney', enabled: true },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', language: 'de', timezone: 'Europe/Berlin', enabled: true },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', language: 'fr', timezone: 'Europe/Paris', enabled: true },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', language: 'es', timezone: 'Europe/Madrid', enabled: true },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', language: 'it', timezone: 'Europe/Rome', enabled: true },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', language: 'ja', timezone: 'Asia/Tokyo', enabled: true },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', language: 'pt', timezone: 'America/Sao_Paulo', enabled: true },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', language: 'en', timezone: 'Asia/Kolkata', enabled: true },
];

export const SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, enabled: true },
    { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, enabled: true },
    { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, enabled: true },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, enabled: true },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, enabled: true },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, enabled: true },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, enabled: true },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, enabled: true },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, enabled: true },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, enabled: true },
];

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', enabled: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true, rtl: true },
];

// Exchange rates (mock - in production, fetch from API)
export const EXCHANGE_RATES = {
    USD: 1.00,
    GBP: 0.79,
    EUR: 0.92,
    CAD: 1.36,
    AUD: 1.53,
    JPY: 149.50,
    BRL: 4.97,
    INR: 83.12,
    CHF: 0.88,
    CNY: 7.24,
};

/**
 * Format currency based on locale and currency code
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return `${amount}`;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
    }).format(amount);
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
};

/**
 * Get default settings based on country
 */
export const getCountryDefaults = (countryCode) => {
    const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
    if (!country) return { currency: 'USD', language: 'en' };

    return {
        currency: country.currency,
        language: country.language,
        timezone: country.timezone,
    };
};
