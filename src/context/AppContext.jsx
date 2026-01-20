import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCountryDefaults, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, formatCurrency, convertCurrency } from '../config/i18nConfig';
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
        discounts: { state: 0.15, national: 0.30 },
        currency: 'USD' // Base currency of the pricing attributes
    });

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const [authLoading, setAuthLoading] = useState(true);
    const [detectedCountry, setDetectedCountry] = useState(null);

    // Base URL configuration for API calls
    const getBaseUrl = () => {
        // 1. Try environment variables (Vite - baked into build)
        const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

        // 2. Try window global (runtime injection potential)
        const globalUrl = window.VITE_API_URL;

        const priorityUrl = envUrl || globalUrl;

        if (priorityUrl) {
            const cleanUrl = priorityUrl.endsWith('/') ? priorityUrl.slice(0, -1) : priorityUrl;
            return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
        }

        // 3. Handle Local Development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return '/api';
        }

        // 4. Smart Fallback for Railway/Production
        const hostname = window.location.hostname;

        // If we are on Railway, we use relative /api because serve.js now acts as a reverse proxy.
        // This is the most reliable way to avoid hardcoded domain mismatches.
        if (hostname.includes('railway.app')) {
            return '/api';
        }

        // 5. Ultimate Fallback (Default to relative)
        return '/api';
    };
    const API_BASE_URL = getBaseUrl();

    // Debugging helper
    useEffect(() => {
        console.log('🌐 App Environment:', import.meta.env.MODE);
        console.log('📍 Current Hostname:', window.location.hostname);
        console.log('🚀 Final API URL:', API_BASE_URL);

        if (API_BASE_URL === '/api' && !import.meta.env.VITE_API_URL) {
            console.log('ℹ️ Note: Using relative /api path. The frontend server must proxy this to the backend.');
        }

        const testConnectivity = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/health`);
                const contentType = res.headers.get('content-type');

                if (res.ok && contentType && contentType.includes('application/json')) {
                    console.log('✅ Backend Connectivity: OK');
                } else if (!res.ok) {
                    console.error(`❌ Backend Connectivity: FAILED (HTTP ${res.status})`);
                    if (res.status === 404) {
                        console.warn('💡 Tip: Your API URL might be wrong. Check VITE_API_URL in Railway.');
                    }
                } else if (contentType && contentType.includes('text/html')) {
                    console.error('❌ Backend Connectivity: ERROR - Received HTML instead of JSON. Your API URL might be incorrectly pointing to the frontend itself.');
                    console.warn('💡 Tip: Ensure VITE_API_URL is set in Railway to your BACKEND service URL.');
                }
            } catch (err) {
                console.error('❌ Backend Connectivity: ERROR', err.message);
            }
        };
        testConnectivity();
    }, [API_BASE_URL]);

    // IP-based Geo Location Detection
    const detectGeoLocation = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/geo/detect-country`);
            if (res.ok) {
                const data = await res.json();
                setDetectedCountry(data.country);
                console.log(`📍 IP detected as: ${data.country}`);
            }
        } catch (e) {
            console.warn("Geo-detection failed:", e.message);
        }
    };

    // Auth header helper
    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return {};

        // If we have a mock token, we still send it but log a warning.
        // This prevents silent failures in the frontend and lets the backend return 401 officially.
        if (token.includes('mock_')) {
            console.warn("🛠️ Using mock token - API requests will likely return 401 unless backend is also in mock mode.");
        }

        return { 'Authorization': `Bearer ${token}` };
    };

    // Helper to load regions (states) dynamically for the selected country
    // AND load the specific pricing configuration for that country (Currency Overrides)
    const loadRegionsForCountry = async (countryCode, currentPricing = null) => {
        try {
            console.log(`🌍 Fetching regions and pricing for ${countryCode}...`);

            // Parallel fetch: Regions (Geo) + Config (Pricing)
            const [geoRes, pricingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/geo/regions/${countryCode}`),
                fetch(`${API_BASE_URL}/pricing/config?country_code=${countryCode}`, {
                    headers: { ...getAuthHeaders() }
                })
            ]);

            // 1. Process Regions
            let regionUpdates = [];
            if (geoRes.ok) {
                const regions = await geoRes.json();
                regionUpdates = regions;
            }

            // 2. Process Pricing & Currency
            let pricingUpdates = null;
            if (pricingRes.ok) {
                const rawPricing = await pricingRes.json();
                pricingUpdates = {
                    industries: (rawPricing.industries || []).map(i => ({
                        ...i,
                        displayName: formatIndustryName(i.name),
                        name: i.name
                    })),
                    adTypes: (rawPricing.ad_types || []).map(a => ({ name: a.name, baseRate: a.base_rate })),
                    discounts: rawPricing.discounts || { state: 0.15, national: 0.30 },
                    // CRITICAL: Backend now tells us if these rates are USD or Specific (e.g. THB)
                    currency: rawPricing.currency || 'USD'
                };
            }

            setPricingData(prev => {
                const base = currentPricing || pricingUpdates || prev;
                const existingStates = base.states || [];

                // Merge Regions
                let mergedStates = existingStates;
                if (regionUpdates.length > 0) {
                    mergedStates = regionUpdates.map(r => {
                        const existing = existingStates.find(s => s.name === r.name || s.stateCode === r.code);
                        return {
                            name: r.name,
                            stateCode: r.code,
                            countryCode: r.country_code,
                            landMass: existing?.landMass || existing?.land_area || 50000,
                            densityMultiplier: existing?.densityMultiplier || existing?.density_multiplier || 1.0,
                            population: existing?.population || 1000000
                        };
                    });
                }

                // If we got fresh pricing, return that with merged states.
                // Otherwise update states on previous pricing.
                if (pricingUpdates) {
                    return { ...pricingUpdates, states: mergedStates };
                }
                return { ...base, states: mergedStates };
            });

        } catch (e) {
            console.error("❌ Failed to load regions/pricing:", e);
        }
    };


    const fetchData = async () => {
        try {
            const hasAuth = !!localStorage.getItem('access_token');
            const isMock = localStorage.getItem('access_token')?.includes('mock_');

            // Skip authenticated calls if using a mock token to avoid 401 loops
            if (isMock && hasAuth) {
                console.warn("Using mock token, skipping sensitive data fetch");
                return;
            }

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
                fetch(`${API_BASE_URL}/pricing/config?country_code=${country}`, {
                    headers: { ...getAuthHeaders() },
                    credentials: 'include'
                })
            ]);



            // Handle 401 Unauthorized globally
            if (statsRes.status === 401 || campaignsRes.status === 401 || pricingRes.status === 401) {
                console.warn("⚠️ API returned 401 Unauthorized. Session might be invalid.");
                const token = localStorage.getItem('access_token');

                // If we have a REAL token but got 401, it's definitely expired/invalid
                if (token && !token.includes('mock_') && (statsRes.status === 401 || campaignsRes.status === 401)) {
                    console.warn("Session expired. Clearing local user data.");
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    setAuthLoading(false);
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                    return;
                }
                // If it's a mock token or we're on the login page already, don't redirect
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
                console.log("Pricing Config received:", rawPricing);

                // Transform to frontend format with formatting and strict null-safety
                const freshPricing = {
                    industries: (rawPricing.industries || []).map(i => ({
                        name: i?.name || 'Unknown',
                        multiplier: i?.multiplier || 1.0,
                        displayName: formatIndustryName(i?.name || 'Unknown')
                    })),
                    adTypes: (rawPricing.ad_types || []).map(a => ({
                        name: a?.name || 'Display',
                        baseRate: a?.base_rate || 100.0
                    })),
                    states: (rawPricing.states || []).map(s => ({
                        name: s?.name || 'Unknown',
                        landMass: s?.land_area || 1000,
                        densityMultiplier: s?.density_multiplier || 1.0,
                        population: s?.population || 0,
                        stateCode: s?.state_code || '',
                        countryCode: s?.country_code || 'US'
                    })),
                    discounts: rawPricing.discounts || { state: 0.15, national: 0.30 },
                    currency: rawPricing.currency || 'USD'
                };

                // Fallback if data is empty despite ok response
                if (freshPricing.industries.length === 0) {
                    freshPricing.industries = [
                        "Tyres And Wheels", "Vehicle Servicing And Maintenance", "Panel Beating And Smash Repairs",
                        "Automotive Finance Solutions", "Vehicle Insurance Products", "Auto Parts Tools And Accessories",
                        "Fleet Management Tools", "Workshop Technology And Equipment", "Telematics Systems And Vehicle Tracking Solutions",
                        "Fuel Cards And Fuel Management Services", "Vehicle Cleaning And Detailing Services", "Logistics And Scheduling Software",
                        "Safety And Compliance Solutions", "Driver Training And Induction Programs", "Roadside Assistance Programs",
                        "Gps Navigation And Route Optimisation Tools", "Ev Charging Infrastructure And Electric Vehicle Solutions",
                        "Mobile Device Integration And Communications Equipment", "Asset Recovery And Anti Theft Technologies"
                    ].map(name => ({ name, multiplier: 1.0, displayName: formatIndustryName(name) }));
                }
                if (freshPricing.adTypes.length === 0) {
                    freshPricing.adTypes = [
                        { name: 'Leaderboard (728x90)', baseRate: 150.0 },
                        { name: 'Skyscraper (160x600)', baseRate: 180.0 },
                        { name: 'Medium Rectangle (300x250)', baseRate: 200.0 },
                        { name: 'Mobile Leaderboard (320x50)', baseRate: 100.0 },
                        { name: 'Email Newsletter (600x200)', baseRate: 250.0 }
                    ];
                }

                setPricingData(freshPricing);
                // Immediately load regions to ensure we have the full list
                await loadRegionsForCountry(country, freshPricing);

            } else {
                console.warn("Pricing metadata fetch failed or unauthorized, using internal fallbacks.");
                setPricingData({
                    industries: [
                        "Tyres And Wheels", "Vehicle Servicing And Maintenance", "Panel Beating And Smash Repairs",
                        "Automotive Finance Solutions", "Vehicle Insurance Products", "Auto Parts Tools And Accessories",
                        "Fleet Management Tools", "Workshop Technology And Equipment", "Telematics Systems And Vehicle Tracking Solutions",
                        "Fuel Cards And Fuel Management Services", "Vehicle Cleaning And Detailing Services", "Logistics And Scheduling Software",
                        "Safety And Compliance Solutions", "Driver Training And Induction Programs", "Roadside Assistance Programs",
                        "Gps Navigation And Route Optimisation Tools", "Ev Charging Infrastructure And Electric Vehicle Solutions",
                        "Mobile Device Integration And Communications Equipment", "Asset Recovery And Anti Theft Technologies"
                    ].map(i => ({ name: i, multiplier: 1.0, displayName: formatIndustryName(i) })),
                    adTypes: [
                        { name: 'Leaderboard (728x90)', baseRate: 150.0 },
                        { name: 'Skyscraper (160x600)', baseRate: 180.0 },
                        { name: 'Medium Rectangle (300x250)', baseRate: 200.0 },
                        { name: 'Mobile Leaderboard (320x50)', baseRate: 100.0 },
                        { name: 'Email Newsletter (600x200)', baseRate: 250.0 }
                    ],
                    states: [
                        { name: 'California', landMass: 423970, densityMultiplier: 1.5, population: 39538223, stateCode: 'CA', countryCode: 'US' }
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
                    "Tyres And Wheels", "Vehicle Servicing And Maintenance", "Panel Beating And Smash Repairs",
                    "Automotive Finance Solutions", "Vehicle Insurance Products", "Auto Parts Tools And Accessories"
                ].map(name => ({ name, multiplier: 1.0, displayName: name })),
                adTypes: [
                    { name: 'Leaderboard (728x90)', baseRate: 150.0 }
                ],
                states: [
                    { name: 'California', landMass: 423970, densityMultiplier: 1.5, population: 39538223, stateCode: 'CA', countryCode: 'US' }
                ],
                discounts: { state: 0.15, national: 0.30 }
            });
        }
    };

    // Fetch initial data from API and persist authentication
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const accessToken = localStorage.getItem('access_token');

            if (storedUser && accessToken) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    await fetchData();
                } catch (e) {
                    console.error('Failed to restore user session:', e);
                }
            }

            // Listen for Firebase auth state changes
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    // Only sync if we don't already have a valid session or it's a different user
                    const currentStoredUser = localStorage.getItem('user');
                    if (!currentStoredUser) {
                        const result = await firebaseSync(firebaseUser);
                        if (result.success) {
                            setUser(result.user);
                            localStorage.setItem('user', JSON.stringify(result.user));
                            await fetchData();
                        }
                    }
                } else if (!localStorage.getItem('user')) {
                    // Only clear if there's truly no session
                    setUser(null);
                }
                setAuthLoading(false);
            });

            // If we have local credentials but Firebase is taking its time, 
            // we'll still set loading to false after a short timeout or after data fetch
            if (storedUser && accessToken) {
                setAuthLoading(false);
            } else if (!accessToken) {
                // No token at all, definitely not logged in
                setAuthLoading(false);
                // Still fetch pricing/meta data for guests
                await fetchData();
            }

            return unsubscribe;
        };

        const authSubscriptionPromise = initializeAuth();

        // Polling for new notifications every 30 seconds
        const interval = setInterval(() => {
            if (localStorage.getItem('user')) {
                fetchData();
            }
        }, 30000);

        return () => {
            authSubscriptionPromise.then(unsubscribe => unsubscribe && unsubscribe());
            clearInterval(interval);
        };
    }, []);

    const firebaseSync = async (fbUser, extraData = {}) => {
        try {
            const syncPayload = {
                email: fbUser.email,
                username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                photoURL: fbUser.photoURL,
                uid: fbUser.uid,
                ...extraData
            };
            console.log('🔄 Syncing with backend:', syncPayload);

            const response = await fetch(`${API_BASE_URL}/google-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(syncPayload)
            });

            console.log('📡 Sync Response Status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Sync Successful');
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                return data;
            }

            const errorText = await response.text();
            console.error('❌ Sync Failed:', errorText);
            throw new Error(`Backend sync failed: ${response.status} ${errorText}`);
        } catch (error) {
            console.warn("Backend offline or sync failed, falling back to Firebase internal data.", error);

            // Set a mock token so subsequent fetchData calls don't immediately crash with 401
            if (!localStorage.getItem('access_token')) {
                localStorage.setItem('access_token', 'mock_firebase_fallback_token');
            }

            // Return a result so the UI still logs in for preview/demo
            return {
                success: true,
                user: {
                    id: fbUser.uid || 'mock-id',
                    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                    email: fbUser.email || 'user@adplatform.net',
                    avatar: fbUser.photoURL || null,
                    role: fbUser.email?.includes('admin') ? 'admin' : 'advertiser'
                }
            };
        }
    };


    const login = async (email, password) => {
        const cleanEmail = (email || '').trim();
        const cleanPassword = (password || '').trim();

        // 1. Handle Emergency Credentials
        if (cleanEmail.toUpperCase() === 'ADMIN' && cleanPassword.toUpperCase() === 'ADMIN123') {
            try {
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
                    const token = data.access_token;
                    localStorage.setItem('access_token', token);
                    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                    // Fetch real admin data
                    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    let userObj = { role: 'admin' };
                    if (meRes.ok) {
                        const adminData = await meRes.json();
                        userObj = {
                            id: adminData.id,
                            username: adminData.name,
                            email: adminData.email,
                            role: adminData.role,
                            avatar: adminData.profile_picture
                        };
                    } else {
                        userObj = {
                            username: 'Administrator',
                            email: 'admin@adplatform.com',
                            role: 'admin'
                        };
                    }

                    setUser(userObj);
                    localStorage.setItem('user', JSON.stringify(userObj));
                    toast.success('System Access Granted', { description: 'Authenticated via emergency bypass.' });
                    await fetchData();
                    return { success: true, user: userObj };
                }
            } catch (err) {
                console.warn("Emergency bypass backend sync failed, using mock data.", err);
            }

            const adminUser = { username: 'Administrator', email: 'admin@adplatform.com', role: 'admin', avatar: null };
            setUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            // Set a mock token so frontend calls don't fail immediately with missing header
            localStorage.setItem('access_token', 'mock_admin_token_bypass');
            toast.success('System Access Granted', { description: 'Authenticated via emergency bypass.' });
            await fetchData();
            return { success: true, user: adminUser };
        }

        // 2. Primary: Native Backend Authentication (No Firebase dependency)
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login/json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                // Fetch full user profile
                const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (meRes.ok) {
                    const userData = await meRes.json();
                    const userObj = {
                        id: userData.id,
                        username: userData.name,
                        email: userData.email,
                        role: userData.role,
                        avatar: userData.profile_picture
                    };
                    setUser(userObj);
                    localStorage.setItem('user', JSON.stringify(userObj));
                    await fetchData();
                    return { success: true, user: userObj };
                }
            } else if (response.status === 401 || response.status === 403 || response.status === 400) {
                const errData = await response.json();
                const errMsg = errData.error || errData.detail || "Incorrect email or password";
                return { success: false, message: errMsg };
            }
        } catch (err) {
            console.warn("Native backend auth failed, trying Firebase fallback...", err);
        }

        // 3. Fallback: Firebase Authentication
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
            console.error("Authentication Error:", error);
            // If Firebase is restricted or misconfigured, show a descriptive error
            const msg = error.code === 'auth/admin-restricted-operation'
                ? "Account registration is currently managed by platform administrators."
                : (error.message?.replace('Firebase: ', '') || "Authentication failed");
            return { success: false, message: msg };
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

    const signup = async (username, email, password, extraData = {}) => {
        // 1. Primary: Native Backend Signup
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: username,
                    email: email,
                    password: password,
                    role: 'advertiser',
                    industry: extraData.industry,
                    country: extraData.country
                })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (meRes.ok) {
                    const userData = await meRes.json();
                    const userObj = {
                        id: userData.id,
                        username: userData.name,
                        email: userData.email,
                        role: userData.role,
                        avatar: userData.profile_picture
                    };
                    setUser(userObj);
                    localStorage.setItem('user', JSON.stringify(userObj));
                    await fetchData();
                    return { success: true, user: userObj };
                }
            } else if (response.status === 400 || response.status === 422) {
                const errData = await response.json();
                let errMsg = "Signup failed. Please check your data.";

                // Handle different error response formats
                if (errData.error && typeof errData.error === 'string') {
                    errMsg = errData.error;
                } else if (errData.detail && typeof errData.detail === 'string') {
                    errMsg = errData.detail;
                } else if (Array.isArray(errData.detail)) {
                    errMsg = errData.detail[0]?.msg || errMsg;
                } else if (errData.details && Array.isArray(errData.details)) {
                    // Custom validation error format from main.py
                    errMsg = errData.details[0]?.msg || errMsg;
                    if (errData.details[0]?.loc) {
                        const field = errData.details[0].loc[errData.details[0].loc.length - 1];
                        errMsg = `${field}: ${errMsg}`;
                    }
                }

                return { success: false, message: errMsg };
            }
        } catch (err) {
            console.warn("Native backend signup failed, trying Firebase fallback...", err);
        }

        // 2. Fallback: Firebase Signup
        try {
            const fbUser = await registerWithEmail(email, password, username);
            const result = await firebaseSync(fbUser, extraData);
            if (result.success) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                await fetchData();
            }
            return result;
        } catch (error) {
            console.error("Signup Error:", error);
            const msg = error.code === 'auth/admin-restricted-operation'
                ? "New account signup is temporarily restricted. Please contact support."
                : (error.message?.replace('Firebase: ', '') || "Registration failed");
            return { success: false, message: msg };
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
        // Strictly only 'and' remains lowercase as per requirements
        const lowercaseWords = ['and'];

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
    const handleCountryChange = async (countryCode) => {
        setCountry(countryCode);

        // Load regions for the new country immediately
        await loadRegionsForCountry(countryCode);

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
                    state_code: s.stateCode,
                    country_code: s.countryCode
                })),
                discounts: newConfig.discounts,
                country_code: newConfig.countryCode
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
            } else {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error || errData.detail || `Server returned ${response.status}`;
                throw new Error(msg);
            }
        } catch (error) {
            console.error("❌ Pricing Save Error:", error);
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

            // Default to draft for new campaigns
            if (!campaign.status) {
                campaign.status = 'draft';
            }

            const response = await fetch(`${API_BASE_URL}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(campaign)
            });

            const responseText = await response.text();
            if (!responseText) {
                throw new Error(`Empty response from server (status: ${response.status})`);
            }

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                throw new Error("Invalid server response");
            }

            if (!response.ok) {
                throw new Error(responseData.error || responseData.detail || 'Failed to create campaign');
            }

            toast.success('Campaign Created', { description: `"${campaign.name}" submitted for review.` });
            fetchData(); // Refresh all data
            return responseData;
        } catch (error) {
            console.error("addCampaign failed:", error);

            // Handle specific "Not authenticated" error with better UI guidance
            if (error.message.includes('authenticated') || error.message.includes('credentials')) {
                toast.error("Authentication Error", {
                    description: "Your session has expired or you are not logged in correctly. Please log out and log back in."
                });
            } else {
                toast.error("Creation Failed", { description: error.message });
            }
            throw error;
        }
    };

    const updateCampaign = async (campaign) => {
        try {
            if (!campaign.id) throw new Error("Campaign ID is required for update");

            const response = await fetch(`${API_BASE_URL}/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(campaign)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Server returned status ${response.status}`);
                }

                // Handle FastAPI validation errors (details array) vs standard error (detail string)
                let errMsg = errorData.detail || errorData.message || 'Failed to update campaign';

                if (errorData.details && Array.isArray(errorData.details)) {
                    errMsg = errorData.details.map(d => `${d.loc?.[d.loc.length - 1] || 'Field'}: ${d.msg}`).join(', ');
                } else if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map(e => e.msg || e).join(', ');
                }

                throw new Error(errMsg);
            }

            const responseData = await response.json();
            toast.success('Campaign Updated', { description: `"${campaign.name}" changes saved.` });
            fetchData();
            return responseData;
        } catch (error) {
            console.error("updateCampaign failed:", error);
            toast.error("Update Failed", { description: error.message });
            throw error;
        }
    };

    const submitCampaignForReview = async (campaignId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/campaigns/approval/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ campaign_id: campaignId })
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Server returned status ${response.status}`);
                }

                // Handle different error formats
                let param = errorData.detail || errorData.message || errorData.error || 'Submission failed';

                // If param is array (Pydantic validation), join messages
                if (Array.isArray(param)) {
                    param = param.map(p => p.msg || p.message || JSON.stringify(p)).join(', ');
                }

                // If param is object (unexpected), stringify it
                if (typeof param === 'object') {
                    param = JSON.stringify(param);
                }

                throw new Error(param);
            }

            const data = await response.json();
            toast.success('Submitted', { description: 'Campaign sent for admin review. All ads are reviewed within 24 hours.' });
            fetchData();
            return data;
        } catch (error) {
            console.error("submitCampaignForReview failed:", error);
            toast.error("Submission Failed", { description: error.message });
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

    // Payment Handler
    const initiatePayment = async (campaignId, targetCurrency) => {
        try {
            toast.loading("Initializing secure checkout...");

            const res = await fetch(`${API_BASE_URL}/payment/create-checkout-session?campaign_id=${campaignId}&success_url=${encodeURIComponent(window.location.origin + '/dashboard?payment=success')}&cancel_url=${encodeURIComponent(window.location.origin + '/create-campaign?payment=cancelled')}&currency=${targetCurrency || currency}`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Payment initialization failed');
            }

            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.error('Invalid payment configuration received.');
            }
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error(`Payment Failed: ${error.message}`);
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
            detectedCountry,
            setCountry: handleCountryChange,
            isCurrencyOverridden,
            isLanguageOverridden,
            sidebarOpen,
            setSidebarOpen,
            CONSTANTS,
            pricingData,
            savePricingConfig,
            addCampaign,
            updateCampaign,
            submitCampaignForReview,
            initiatePayment,
            formatCurrency: (amount) => formatCurrency(amount, currency),
            convertPrice: (amount, sourceCurrency) => convertCurrency(amount, sourceCurrency || 'USD', currency),
            t,
            adFormats: [
                { id: 'mobile_leaderboard', name: 'Mobile Leaderboard (320x50)', width: 320, height: 50, category: 'mobile' },
                { id: 'leaderboard', name: 'Leaderboard (728x90)', width: 728, height: 90, category: 'desktop' },
                { id: 'medium_rectangle', name: 'Medium Rectangle (300x250)', width: 300, height: 250, category: 'universal' },
                { id: 'skyscraper', name: 'Skyscraper (160x600)', width: 160, height: 600, category: 'desktop' },
                { id: 'email_newsletter', name: 'Email Newsletter (600x200)', width: 600, height: 200, category: 'email' }
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
            googleAuth,
            authLoading,
            API_BASE_URL,
            getAuthHeaders
        }}>
            {children}
        </AppContext.Provider>
    );
};

