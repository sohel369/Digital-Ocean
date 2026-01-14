/**
 * Internationalization Configuration
 * Supports requested countries, currencies, and languages.
 */

export const SUPPORTED_COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', language: 'en', timezone: 'America/New_York', enabled: true },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', language: 'hi', timezone: 'Asia/Kolkata', enabled: true },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', language: 'th', timezone: 'Asia/Bangkok', enabled: true },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh', enabled: true },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', language: 'fil', timezone: 'Asia/Manila', enabled: true },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', language: 'en', timezone: 'Australia/Sydney', enabled: true },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', language: 'en', timezone: 'Europe/London', enabled: true },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', language: 'en', timezone: 'America/Toronto', enabled: true },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', language: 'fr', timezone: 'Europe/Paris', enabled: true },
];

export const SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, enabled: true },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, enabled: true },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, enabled: true },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, enabled: true },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2, enabled: true },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, enabled: true },
    { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, enabled: true },
    { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, enabled: true },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, enabled: true },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, enabled: true },
];

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
];

// Exchange rates (mock - in production, fetch from API)
export const EXCHANGE_RATES = {
    USD: 1.00,
    INR: 83.20,
    IDR: 15600,
    VND: 24500,
    PHP: 56.20,
    THB: 35.80,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.53,
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
