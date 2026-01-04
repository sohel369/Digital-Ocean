import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCountryDefaults, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '../config/i18nConfig';

/**
 * Global Context for managing:
 * - Country/Currency/Language settings
 * - User preferences
 * - Notifications
 * - Real-time updates
 */

const GlobalContext = createContext();

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal must be used within GlobalProvider');
    }
    return context;
};

export const GlobalProvider = ({ children }) => {
    // User Profile & Location
    const [userProfile, setUserProfile] = useState({
        id: 'user_123',
        name: 'John Advertiser',
        email: 'john@company.com',
        country: 'US',
        role: 'advertiser',
    });

    // I18n Settings
    const [country, setCountry] = useState(userProfile.country);
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('en');

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize settings from user profile
    useEffect(() => {
        const defaults = getCountryDefaults(userProfile.country);
        setCurrency(defaults.currency);
        setLanguage(defaults.language);
    }, [userProfile.country]);

    // Update unread count
    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    /**
     * Change country and auto-update currency/language
     */
    const changeCountry = (countryCode) => {
        setCountry(countryCode);
        const defaults = getCountryDefaults(countryCode);
        setCurrency(defaults.currency);
        setLanguage(defaults.language);
    };

    /**
     * Add notification
     */
    const addNotification = (notification) => {
        const newNotification = {
            id: `notif_${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: false,
            ...notification,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    /**
     * Mark notification as read
     */
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    /**
     * Mark all as read
     */
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    /**
     * Clear notification
     */
    const clearNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    /**
     * Get enabled countries/currencies/languages
     */
    const getEnabledCountries = () => SUPPORTED_COUNTRIES.filter(c => c.enabled);
    const getEnabledCurrencies = () => SUPPORTED_CURRENCIES.filter(c => c.enabled);
    const getEnabledLanguages = () => SUPPORTED_LANGUAGES.filter(l => l.enabled);

    const value = {
        // User
        userProfile,
        setUserProfile,

        // I18n
        country,
        currency,
        language,
        setCountry: changeCountry,
        setCurrency,
        setLanguage,

        // Helpers
        getEnabledCountries,
        getEnabledCurrencies,
        getEnabledLanguages,

        // Notifications
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalContext;
