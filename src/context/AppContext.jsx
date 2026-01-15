import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCountryDefaults, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, formatCurrency } from '../config/i18nConfig';
import { translations } from '../config/translations';
import { toast } from 'sonner';
import {
    auth,
    loginWithEmail,
    registerWithEmail,
    onAuthStateChanged,
    signOut
} from '../firebase';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // State management for API data
    const [stats, setStats] = useState({
        totalSpend: 0,
        impressions: 0,
        ctr: 0,
        budgetRemaining: 0
    });

    const [campaigns, setCampaigns] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [pricingData, setPricingData] = useState({
        industries: [],
        adTypes: [],
        states: [],
        discounts: { state: 0.15, national: 0.30 }
    });

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    // Base URL configuration for API calls
    const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost'
            ? '/api'
            : (window.location.origin + '/api')); // Default to relative /api on same domain

    // Backup Fallback (Old Railway URL - only used if previous detection seems likely to fail or for legacy)
    const BACKUP_API_URL = 'https://balanced-wholeness-production-ca00.up.railway.app/api';

    // Debugging helper
    useEffect(() => {
        console.log('🌐 App Environment:', import.meta.env.MODE);
        console.log('📍 Current Hostname:', window.location.hostname);
        console.log('🚀 Primary API URL:', API_BASE_URL);

        // Connectivity test
        fetch(`${API_BASE_URL}/health`).catch(err => {
            console.error('⚠️ Primary API seems unreachable:', err.message);
            console.log('🔄 Attempting to use backup fallback:', BACKUP_API_URL);
        });
    }, [API_BASE_URL]);

    // Auth header helper
    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };


    const fetchData = async () => {
        try {
            // Fetch basic data in parallel
            const [statsRes, campaignsRes, notifRes, pricingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/stats`, {
                    headers: { ...getAuthHeaders() },
                    credentials: 'include'
                }),
                fetch(`${API_BASE_URL}/campaigns`, {
                    headers: { ...getAuthHeaders() },
                    credentials: 'include'
                }),
                fetch(`${API_BASE_URL}/notifications`, {
                    headers: { ...getAuthHeaders() },
                    credentials: 'include'
                }),
                fetch(`${API_BASE_URL}/pricing/config`, {
                    headers: { ...getAuthHeaders() },
                    credentials: 'include'
                })
            ]);



            // Clear session only if we HAD a token and it's now invalid
            if (statsRes.status === 401 || campaignsRes.status === 401) {
                const hasToken = localStorage.getItem('access_token');
                if (hasToken && localStorage.getItem('user')) {
                    console.warn("Session expired. Clearing local user data.");
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    setUser(null);
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return;
            }

            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            if (campaignsRes.ok) {
                const campaignsData = await campaignsRes.json();
                const formattedCampaigns = campaignsData.map(c => ({
                    ...c,
                    startDate: c.start_date || '2024-12-01'
                }));
                setCampaigns(formattedCampaigns.reverse());
            }

            if (notifRes.ok) {
                setNotifications(await notifRes.json());
            }

            if (pricingRes && pricingRes.ok) {
                const rawPricing = await pricingRes.json();
                // Transform to frontend format with formatting
                setPricingData({
                    industries: (rawPricing.industries || []).map(i => ({
                        ...i,
                        displayName: formatIndustryName(i.name), // Format for UI
                        name: i.name // Keep raw for database
                    })),
                    adTypes: (rawPricing.ad_types || []).map(a => ({ name: a.name, baseRate: a.base_rate })),
                    states: (rawPricing.states || []).map(s => ({
                        name: s.name,
                        landMass: s.land_area,
                        densityMultiplier: s.density_multiplier,
                        population: s.population,
                        stateCode: s.state_code,
                        countryCode: s.country_code
                    })),
                    discounts: rawPricing.discounts || { state: 0.15, national: 0.30 }
                });
            } else {
                console.warn("Pricing metadata fetch failed or unauthorized, using internal fallbacks.");
                setPricingData({
                    industries: [
                        { name: 'Retail', multiplier: 1.0 },
                        { name: 'Healthcare', multiplier: 1.5 },
                        { name: 'Tech', multiplier: 1.3 },
                        { name: 'Real Estate', multiplier: 1.2 },
                        { name: 'Finance', multiplier: 1.4 }
                    ].map(i => ({ ...i, displayName: formatIndustryName(i.name) })),
                    adTypes: [
                        { name: 'Display', baseRate: 100.0 },
                        { name: 'Video', baseRate: 250.0 },
                        { name: 'Sponsored', baseRate: 150.0 }
                    ],
                    states: [
                        { name: 'California', landMass: 423970, densityMultiplier: 1.5, population: 39538223, stateCode: 'CA', countryCode: 'US' },
                        { name: 'New York', landMass: 141300, densityMultiplier: 1.8, population: 20201249, stateCode: 'NY', countryCode: 'US' },
                        { name: 'Texas', landMass: 695662, densityMultiplier: 1.2, population: 29145505, stateCode: 'TX', countryCode: 'US' }
                    ],
                    discounts: { state: 0.15, national: 0.30 }
                });
            }


        } catch (error) {
            console.error("🌐 Failed to fetch data from API:", error);
            console.warn("Using internal fallback data due to connection error.");

            // Apply emergency fallbacks so the UI doesn't hang at "Loading..."
            setPricingData(prev => prev.industries.length > 0 ? prev : {
                industries: [
                    { name: 'Retail', displayName: 'Retail', multiplier: 1.0 },
                    { name: 'Healthcare', displayName: 'Healthcare', multiplier: 1.5 },
                    { name: 'Tech', displayName: 'Tech', multiplier: 1.3 }
                ],
                adTypes: [
                    { name: 'Display', baseRate: 100.0 },
                    { name: 'Video', baseRate: 250.0 }
                ],
                states: [
                    { name: 'California', landMass: 423970, densityMultiplier: 1.5, population: 39538223, stateCode: 'CA', countryCode: 'US' }
                ],
                discounts: { state: 0.15, national: 0.30 }
            });
        }
    };

    // Fetch initial data from API
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Sync with backend to get local user data/role
                const result = await firebaseSync(firebaseUser);
                if (result.success) {
                    setUser(result.user);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    fetchData();
                }
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
        });

        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const firebaseSync = async (fbUser) => {
        try {
            const response = await fetch(`${API_BASE_URL}/google-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: fbUser.email,
                    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                    photoURL: fbUser.photoURL,
                    uid: fbUser.uid
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                return data;
            }
            throw new Error('Backend sync failed');
        } catch (error) {
            console.warn("Backend offline or sync failed, falling back to Firebase internal data.", error);
            // Return a result so the UI still logs in for preview/demo
            return {
                success: true,
                user: {
                    id: fbUser.uid || 'mock-id',
                    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Admin',
                    email: fbUser.email || 'admin@adplatform.net',
                    avatar: fbUser.photoURL || null,
                    role: 'admin'
                }
            };
        }
    };


    const login = async (email, password) => {
        // Handle Emergency Credentials locally
        const cleanEmail = (email || '').trim().toUpperCase();
        const cleanPassword = (password || '').trim().toUpperCase();
        console.log('Login attempt:', { email: cleanEmail, password: cleanPassword });

        if (cleanEmail === 'ADMIN' && cleanPassword === 'ADMIN123') {
            try {
                // Attempt real backend authentication for emergency bypass using URLSearchParams (Form Data)
                const params = new URLSearchParams();
                params.append('username', 'admin@adplatform.com');
                params.append('password', 'admin123');

                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);

                    // Fetch real admin data
                    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${data.access_token}` }
                    });
                    const adminData = await meRes.json();

                    const userObj = {
                        id: adminData.id,
                        username: adminData.name,
                        email: adminData.email,
                        role: adminData.role,
                        avatar: adminData.profile_picture
                    };

                    setUser(userObj);
                    localStorage.setItem('user', JSON.stringify(userObj));
                    toast.success('System Access Granted', { description: 'Authenticated via emergency bypass.' });
                    await fetchData();
                    return { success: true, user: userObj };
                }
            } catch (err) {
                console.warn("Emergency bypass backend sync failed, using mock data.", err);
            }

            // Extreme fallback if backend init_db hasn't run or is offline
            const adminUser = {
                username: 'Administrator',
                email: 'admin@adplatform.net',
                role: 'admin',
                avatar: null
            };
            setUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            toast.success('System Access Granted', { description: 'Authenticated via emergency bypass.' });
            await fetchData();
            return { success: true, user: adminUser };
        }


        try {
            const fbUser = await loginWithEmail(email, password);
            const result = await firebaseSync(fbUser);
            if (result.success) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                await fetchData();
                return { success: true, user: result.user };
            }
            return { success: false, message: "Sync failed" };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.message };
        }
    };

    const googleAuth = async (googleUser) => {
        const result = await firebaseSync(googleUser);
        if (result.success) {
            setUser(result.user);
            localStorage.setItem('user', JSON.stringify(result.user));
            await fetchData();
        }
        return result;
    };

    const signup = async (username, email, password) => {
        try {
            const fbUser = await registerWithEmail(email, password, username);
            const result = await firebaseSync(fbUser);
            if (result.success) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                await fetchData();
            }
            return result;
        } catch (error) {
            console.error("Signup Error:", error);
            return { success: false, message: error.message };
        }
    };

    const [currency, setCurrencyState] = useState(() => localStorage.getItem('currency') || 'USD');
    const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en');
    const [country, setCountry] = useState(() => localStorage.getItem('country') || 'US');
    const [isCurrencyOverridden, setIsCurrencyOverridden] = useState(() => localStorage.getItem('isCurrencyOverridden') === 'true');
    const [isLanguageOverridden, setIsLanguageOverridden] = useState(() => localStorage.getItem('isLanguageOverridden') === 'true');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Persist preferences
    useEffect(() => {
        localStorage.setItem('currency', currency);
        localStorage.setItem('isCurrencyOverridden', isCurrencyOverridden);
    }, [currency, isCurrencyOverridden]);

    useEffect(() => {
        localStorage.setItem('language', language);
        localStorage.setItem('isLanguageOverridden', isLanguageOverridden);
    }, [language, isLanguageOverridden]);

    useEffect(() => {
        localStorage.setItem('country', country);
    }, [country]);

    const setCurrency = (code, isManual = true) => {
        setCurrencyState(code);
        if (isManual) setIsCurrencyOverridden(true);
    };

    const setLanguage = (code, isManual = true) => {
        setLanguageState(code);
        if (isManual) setIsLanguageOverridden(true);
    };

    // Translation Helper
    const t = (path, replacements = {}) => {
        const keys = path.split('.');
        let value = translations[language] || translations['en'];

        for (const key of keys) {
            value = value?.[key];
        }

        // Return path if value is not a string, but try to beautify it
        if (typeof value !== 'string') {
            const lastKey = keys[keys.length - 1];
            // If it looks like a key (has dots or underscores), beautify it
            return lastKey
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        Object.entries(replacements).forEach(([key, val]) => {
            value = value.replace(`{{${key}}}`, val);
        });

        return value;
    };

    // Helper to format industry names (Polish)
    const formatIndustryName = (name) => {
        if (!name) return name;
        const lowercaseWords = ['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by'];

        return name
            .split(' ')
            .map((word, index) => {
                const lower = word.toLowerCase();
                if (index > 0 && lowercaseWords.includes(lower)) return lower;

                // Handle hyphens for words like Anti-Theft
                return word.split('-').map(part =>
                    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                ).join('-');
            })
            .join(' ');
    };

    // Country × Language × Currency Sync Logic
    const handleCountryChange = (countryCode) => {
        setCountry(countryCode);
        const defaults = getCountryDefaults(countryCode);
        if (defaults) {
            // Country change ALWAYS resets overrides to ensure predictable behavior
            setCurrency(defaults.currency, false);
            setLanguage(defaults.language, false);
            setIsCurrencyOverridden(false);
            setIsLanguageOverridden(false);
            toast.info(`Synced: ${countryCode} defaults applied.`);
        }
    };


    // Dynamic Pricing Data handles by state now
    const savePricingConfig = async (newConfig) => {
        try {
            // Transform back to backend format
            const backendConfig = {
                industries: newConfig.industries,
                ad_types: newConfig.adTypes.map(a => ({ name: a.name, base_rate: a.baseRate })),
                states: newConfig.states.map(s => ({
                    name: s.name,
                    land_area: s.landMass,
                    population: s.population || 0,
                    density_multiplier: s.densityMultiplier,
                    state_code: s.stateCode
                })),
                discounts: newConfig.discounts
            };

            const response = await fetch(`${API_BASE_URL}/pricing/admin/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(backendConfig)
            });

            if (response.ok) {
                setPricingData(newConfig);
                toast.success("Pricing configurations updated successfully!");
                return true;
            }
            throw new Error("Failed to save pricing configuration");
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Save Error", { description: error.message });
            return false;
        }
    };


    const CONSTANTS = {
        COUNTRIES: SUPPORTED_COUNTRIES,
        CURRENCIES: SUPPORTED_CURRENCIES,
        LANGUAGES: SUPPORTED_LANGUAGES
    };

    const addCampaign = async (campaign) => {
        try {
            console.log('Creating campaign at:', `${API_BASE_URL}/campaigns`);
            console.log('Campaign data:', JSON.stringify(campaign, null, 2));

            const response = await fetch(`${API_BASE_URL}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(campaign)
            });


            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            // Get response text first to handle empty responses
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (!responseText) {
                throw new Error(`Empty response from server (status: ${response.status}). This may be a CORS or server error.`);
            }

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
            }

            if (response.ok) {
                const newCamp = responseData;

                // Ensure the new campaign is added to the local state immediately
                const formattedNewCamp = {
                    ...newCamp,
                    startDate: newCamp.start_date || campaign.startDate
                };

                setCampaigns(prev => [formattedNewCamp, ...prev]);

                // Refresh stats and notifications in parallel
                const [statsRes, notifRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/stats`, {
                        headers: { ...getAuthHeaders() },
                        credentials: 'include'
                    }),
                    fetch(`${API_BASE_URL}/notifications`, {
                        headers: { ...getAuthHeaders() },
                        credentials: 'include'
                    })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (notifRes.ok) setNotifications(await notifRes.json());

                toast.success('Campaign Created', { description: `"${campaign.name}" stored in database.` });
                return formattedNewCamp;
            } else if (response.status === 401) {
                localStorage.removeItem('user');
                setUser(null);
                window.location.href = '/login';
                throw new Error("Session expired. Please log in again.");
            } else {
                throw new Error(responseData.message || responseData.error || `Server error: ${response.status}`);
            }
        } catch (error) {
            console.error("API Error:", error);
            // Check for network/CORS errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                toast.error("Network Error", { description: "Cannot connect to server. Check if CORS is configured correctly." });
            } else {
                toast.error("Sync Error", { description: error.message || "Campaign not saved to backend." });
            }
            throw error;
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read`, {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                credentials: 'include'
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth); // Terminate Firebase session
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                credentials: 'include'
            });

        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            window.location.href = '/login';
        }

    };

    return (
        <AppContext.Provider value={{
            stats,
            campaigns,
            notifications,
            user,
            currency,
            setCurrency,
            language,
            setLanguage,
            country,
            setCountry: handleCountryChange,
            isCurrencyOverridden,
            isLanguageOverridden,
            sidebarOpen,
            setSidebarOpen,
            CONSTANTS,
            pricingData,
            savePricingConfig,
            addCampaign,
            formatCurrency: (amount) => formatCurrency(amount, currency),
            t,
            adFormats: [
                { id: 'mobile_leaderboard', name: 'Mobile Leaderboard (320x50)', width: 320, height: 50, category: 'mobile' },
                { id: 'leaderboard', name: 'Leaderboard (728x90)', width: 728, height: 90, category: 'desktop' },
                { id: 'medium_rectangle', name: 'Medium Rectangle (300x250)', width: 300, height: 250, category: 'universal' },
                { id: 'skyscraper', name: 'Skyscraper (160x600)', width: 160, height: 600, category: 'desktop' }
            ],
            ctaOptions: [
                'Learn More',
                'Shop Now',
                'Sign Up',
                'Get Quote',
                'Book Now',
                'Contact Us'
            ],
            formatIndustryName,
            handleCountryChange,

            markAllRead,
            logout,
            login,
            signup,
            googleAuth
        }}>
            {children}
        </AppContext.Provider>
    );
};

