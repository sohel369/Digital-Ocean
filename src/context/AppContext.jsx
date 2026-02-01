import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCountryDefaults, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, formatCurrency, convertCurrency } from '../config/i18nConfig';
import { getGeoConfig } from '../config/geoData';
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
        industries: [
            { name: 'Retail', displayName: 'Retail', multiplier: 1.2 },
            { name: 'Healthcare', displayName: 'Healthcare', multiplier: 1.5 },
            { name: 'Technology', displayName: 'Technology', multiplier: 1.0 }
        ],
        adTypes: [
            { name: 'Display', baseRate: 100.0 }
        ],
        states: [],
        discounts: { state: 0.15, national: 0.30 },
        currency: 'USD'
    });

    const [paymentConfig, setPaymentConfig] = useState({
        publishableKey: '',
        isSandbox: true,
        environment: 'sandbox'
    });

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const [geoSettings, setGeoSettings] = useState(() => {
        const stored = localStorage.getItem('geo_settings');
        try {
            return stored ? JSON.parse(stored) : {
                radius: 30,
                lat: 40.7128,
                lng: -74.0060,
                postcode: '',
                addressLabel: 'New York, US',
                coverageArea: 'radius',
                targetState: '',
                lastUpdated: null
            };
        } catch (e) {
            return { radius: 30, lat: 40.7128, lng: -74.0060, postcode: '', addressLabel: 'New York, US', coverageArea: 'radius', targetState: '', lastUpdated: null };
        }
    });

    const [authLoading, setAuthLoading] = useState(true);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
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

        // STRICT VALIDATION: Only send token if it's a non-empty string and not 'null'/'undefined'
        if (!token || token === 'null' || token === 'undefined') {
            return {};
        }

        // If we have a mock token, we still send it but log a warning.
        // This prevents silent failures in the frontend and lets the backend return 401 officially.
        if (token.includes('mock_')) {
            console.warn("🛠️ Using mock token - API requests will likely return 401 unless backend is also in mock mode.");
        }

        return { 'Authorization': `Bearer ${token}` };
    };

    // Track which countries have already been synchronized to avoid redundant API calls
    const [syncedCountries, setSyncedCountries] = React.useState(new Set());

    const loadRegionsForCountry = React.useCallback(async (countryCode, currentPricing = null, silent = false) => {
        if (!countryCode) return;

        // Skip loading state if already synced and not forcing
        const isAlreadySynced = syncedCountries.has(countryCode);

        try {
            if (!silent && !isAlreadySynced) setIsGeoLoading(true);
            console.log(`🌍 ${silent ? 'Silent' : 'Active'} fetch for ${countryCode} regions...`);

            // Parallel fetch: Regions (Geo) + Config (Pricing)
            const [geoRes, pricingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/geo/regions/${countryCode}`, {
                    headers: { ...getAuthHeaders() }
                }),
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
                    adTypes: (rawPricing.ad_types || [])
                        .reduce((acc, current) => {
                            const x = acc.find(item => item.name === current.name);
                            if (!x && current.name.toLowerCase() !== 'display') {
                                return acc.concat([{ name: current.name, baseRate: current.base_rate }]);
                            }
                            return acc;
                        }, []),
                    discounts: rawPricing.discounts || { state: 0.15, national: 0.30 },
                    currency: rawPricing.currency || 'USD',
                    statesRaw: rawPricing.states || []
                };
            }

            setPricingData(prev => {
                const base = currentPricing || prev;
                const existingStates = base.states || [];

                // industries and adTypes should NOT be overwritten if the new pricingUpdates is partial or empty
                const mergedIndustries = (pricingUpdates?.industries?.length > 0)
                    ? pricingUpdates.industries
                    : base.industries;

                const mergedAdTypes = (pricingUpdates?.adTypes?.length > 0)
                    ? pricingUpdates.adTypes
                    : base.adTypes;

                // Merge Regions Additively - don't lose old ones
                let updatedStates = [...existingStates];

                // 1. Get Static Defaults
                const staticGeo = getGeoConfig(countryCode);
                const staticRegions = staticGeo ? staticGeo.regions : [];

                // 2. Prepare a map of API regions for easy lookup
                const apiRegionMap = new Map();
                if (regionUpdates.length > 0) {
                    regionUpdates.forEach(r => apiRegionMap.set((r.name || r.state_name || '').toLowerCase(), r));
                }

                // 3. Prepare a map of pricing data for metrics
                const pricingApiMap = new Map();
                if (pricingUpdates?.statesRaw) {
                    pricingUpdates.statesRaw.forEach(s => pricingApiMap.set((s.name || s.state_name || '').toLowerCase(), s));
                }

                // 4. Merge: Static Regions + API Data (API overrides values, Static provides coverage)
                // First, remove existing states for this country from the state list to avoid dupes/stale data
                updatedStates = updatedStates.filter(s => String(s.countryCode || '').toUpperCase() !== String(countryCode || '').toUpperCase());

                const mergedRegions = staticRegions.map(staticReg => {
                    const nameKey = staticReg.name.toLowerCase();
                    const geoApiReg = apiRegionMap.get(nameKey);
                    const pricingReg = pricingApiMap.get(nameKey);

                    // Priority: Pricing API > Geo API > Static Default (Fallback to static if API returns 0)
                    const apiPop = pricingReg?.population || geoApiReg?.population;
                    const apiArea = pricingReg?.land_area || geoApiReg?.land_area;
                    const apiDensity = pricingReg?.density_multiplier || geoApiReg?.density_multiplier;

                    return {
                        name: staticReg.name,
                        stateCode: pricingReg?.state_code || geoApiReg?.code || staticReg.code,
                        countryCode: countryCode,
                        landMass: (apiArea && apiArea > 0) ? apiArea : (staticReg.land_area || 1000),
                        densityMultiplier: (apiDensity && apiDensity > 0) ? apiDensity : (staticReg.density_multiplier || 1.0),
                        radiusAreasCount: pricingReg?.radius_areas_count || geoApiReg?.radius_areas_count || staticReg.radius_areas_count || 1,
                        population: (apiPop && apiPop > 0) ? apiPop : (staticReg.population || 0),
                        fips: pricingReg?.fips || geoApiReg?.fips || staticReg.fips,
                        densityMi: pricingReg?.density_mi || geoApiReg?.density_mi || staticReg.density,
                        rank: pricingReg?.rank || geoApiReg?.rank || staticReg.rank,
                        populationPercent: pricingReg?.population_percent || geoApiReg?.population_percent || staticReg.population_percent
                    };
                });

                // 5. Add any API regions that MIGHT not be in static list (edge case: custom regions added by admin manually)
                const allApiSources = [...regionUpdates];
                if (pricingUpdates?.statesRaw) {
                    pricingUpdates.statesRaw.forEach(s => {
                        if (!allApiSources.find(r => (r.name || r.state_name || '').toLowerCase() === (s.name || s.state_name || '').toLowerCase())) {
                            allApiSources.push(s);
                        }
                    });
                }

                allApiSources.forEach(r => {
                    const rName = r.name || r.state_name;
                    if (!rName) return;
                    const exists = mergedRegions.find(m => m.name.toLowerCase() === rName.toLowerCase());
                    if (!exists) {
                        const nameKey = rName.toLowerCase();
                        const pricingReg = pricingApiMap.get(nameKey);
                        mergedRegions.push({
                            name: rName,
                            stateCode: r.code || r.state_code || pricingReg?.state_code,
                            countryCode: r.country_code || pricingReg?.country_code || countryCode,
                            landMass: r.land_area || pricingReg?.land_area || 1000,
                            densityMultiplier: r.density_multiplier || pricingReg?.density_multiplier || 1.0,
                            radiusAreasCount: r.radius_areas_count || pricingReg?.radius_areas_count || 1,
                            population: r.population || pricingReg?.population || 0,
                            fips: r.fips || pricingReg?.fips,
                            densityMi: r.density_mi || pricingReg?.density_mi,
                            rank: r.rank || pricingReg?.rank,
                            populationPercent: r.population_percent || pricingReg?.population_percent
                        });
                    }
                });

                // Update synced set
                setSyncedCountries(prevSet => new Set(prevSet).add(countryCode));

                return {
                    ...base,
                    ...pricingUpdates,
                    industries: mergedIndustries,
                    adTypes: mergedAdTypes,
                    states: [...updatedStates, ...mergedRegions],
                    discounts: pricingUpdates?.discounts || base.discounts,
                    currency: pricingUpdates?.currency || base.currency
                };
            });

        } catch (e) {
            console.error("❌ Failed to load regions/pricing:", e);
            toast.error("Connectivity Issue", { description: "Failed to load regional targeting data. Please refresh." });
        } finally {
            if (!silent) setIsGeoLoading(false);
        }
    }, [syncedCountries, API_BASE_URL]);


    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const hasAuth = !!token && token !== 'null' && token !== 'undefined';
            const isMock = token?.includes('mock_');

            // 1. Fetch Shared/Public Data first (Pricing, Payment Config)
            // pricing/config handles optional auth internally to return contextual data
            const pricingUrl = `${API_BASE_URL}/pricing/config?country_code=${country}`;
            const [pricingRes, paymentRes] = await Promise.all([
                fetch(pricingUrl, { headers: { ...getAuthHeaders() }, credentials: 'include' }),
                fetch(`${API_BASE_URL}/payment/config`, { headers: { ...getAuthHeaders() }, credentials: 'include' })
            ]);

            // Handle Pricing Data
            if (pricingRes.ok) {
                const rawPricing = await pricingRes.json();
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
                        name: s?.name || s?.state_name || 'Unknown',
                        landMass: s?.land_area || 1000,
                        densityMultiplier: s?.density_multiplier || 1.0,
                        radiusAreasCount: s?.radius_areas_count || 1,
                        population: s?.population || 0,
                        stateCode: s?.state_code || '',
                        countryCode: s?.country_code || 'US',
                        fips: s?.fips,
                        densityMi: s?.density_mi,
                        rank: s?.rank,
                        populationPercent: s?.population_percent
                    })),
                    discounts: rawPricing.discounts || { state: 0.15, national: 0.30 },
                    currency: rawPricing.currency || 'USD'
                };
                setPricingData(freshPricing);
                // Immediately load regions to ensure we have the full list
                // Use silent: true for background poll to avoid disruptive UI loaders
                await loadRegionsForCountry(country, freshPricing, true);
            }

            if (paymentRes.ok) {
                setPaymentConfig(await paymentRes.json());
            }

            // Ensure we at least have dummy data if pricing fails
            if (!pricingRes.ok) {
                console.warn("⚠️ Using fallback pricing data due to API failure.");
            }

            // 2. Fetch Sensitive Data ONLY if we have a real token
            if (hasAuth && !isMock) {
                const [statsRes, campaignsRes, notifRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/stats`, { headers: { ...getAuthHeaders() }, credentials: 'include' }),
                    fetch(`${API_BASE_URL}/campaigns`, { headers: { ...getAuthHeaders() }, credentials: 'include' }),
                    fetch(`${API_BASE_URL}/notifications`, { headers: { ...getAuthHeaders() }, credentials: 'include' })
                ]);

                if (statsRes.status === 401 || campaignsRes.status === 401) {
                    console.warn("🛡️ Auth expired or invalid detected in sensitive fetch.");
                    // Only clear and redirect if we are not on login/landing
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        localStorage.removeItem('user');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        setUser(null);
                        setAuthLoading(false);
                        window.location.href = '/login';
                        return;
                    }
                }

                if (statsRes.ok) setStats(await statsRes.json());
                if (campaignsRes.ok) {
                    const campaignsData = await campaignsRes.json();
                    setCampaigns(campaignsData.reverse());
                }
                if (notifRes.ok) setNotifications(await notifRes.json());
            } else if (isMock) {
                console.info("🎭 Mock session: Sensitive API calls skipped.");
            }

        } catch (error) {
            console.error("🌐 Global Data Fetch Error:", error);
            // Ensure we clear loading states even on failure
            setIsGeoLoading(false);
        }
    };


    // Sync active country with user profile when user state changes
    useEffect(() => {
        if (user?.country) {
            console.log('🔄 Syncing country from user profile:', user.country);
            handleCountryChange(user.country);
        }
    }, [user?.country]); // Sync whenever country field updates (e.g. after background refresh)

    // Fetch initial data from API and persist authentication
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const accessToken = localStorage.getItem('access_token');

            if (storedUser && accessToken) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);

                    // Force refresh user data from backend to ensure country/industry are synced
                    // This fixes the issue where local storage has stale "US" default while DB has "Thailand"
                    try {
                        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                        });
                        if (meRes.ok) {
                            const freshUser = await meRes.json();
                            // Map backend fields to frontend user object structure if needed
                            const mappedUser = {
                                ...userData, // keep client-side props
                                id: freshUser.id,
                                username: freshUser.name,
                                email: freshUser.email,
                                role: freshUser.role,
                                country: freshUser.country || userData.country,
                                industry: freshUser.industry || userData.industry,
                                avatar: freshUser.profile_picture || userData.avatar
                            };
                            if (JSON.stringify(mappedUser) !== JSON.stringify(userData)) {
                                console.log("🔄 Refreshing stale user profile from backend...");
                                setUser(mappedUser);
                                localStorage.setItem('user', JSON.stringify(mappedUser));
                            }
                        }
                    } catch (err) {
                        console.warn("Background user sync failed:", err);
                    }

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

            // Always attempt to detect location on start
            detectGeoLocation();

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
    }, [loadRegionsForCountry]); // Added loadRegionsForCountry as it's now stable

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
        const isDefaultAdmin = cleanEmail.toLowerCase() === 'admin@adplatform.com' || cleanEmail.toLowerCase() === 'admin';

        // Helper for Native Backend Login (used for fallback or admin accounts)
        const tryNativeLogin = async (e, p) => {
            try {
                const loginPayload = {
                    email: e.includes('@') ? e : 'admin@adplatform.com',
                    password: p
                };

                const response = await fetch(`${API_BASE_URL}/auth/login/json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginPayload)
                });

                if (response.ok) {
                    const tokenData = await response.json();
                    if (tokenData.access_token) {
                        localStorage.setItem('access_token', tokenData.access_token);
                        localStorage.setItem('refresh_token', tokenData.refresh_token || '');

                        // Fetch user profile using the new token
                        const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
                            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
                        });

                        if (userRes.ok) {
                            const userData = await userRes.json();
                            const mappedUser = {
                                id: userData.id,
                                username: userData.name,
                                email: userData.email,
                                role: userData.role,
                                avatar: userData.profile_picture,
                                country: userData.country,
                                industry: userData.industry
                            };

                            setUser(mappedUser);
                            localStorage.setItem('user', JSON.stringify(mappedUser));
                            await fetchData();
                            return { success: true, user: mappedUser };
                        }
                    }
                }
                const errorData = await response.json().catch(() => ({}));
                return { success: false, message: errorData.detail || "Native authentication failed" };
            } catch (err) {
                console.error("Native Login Exception:", err);
                return { success: false, message: "Backend server unreachable" };
            }
        };

        // If it's the default admin, try backend FIRST for speed and Reliability
        if (isDefaultAdmin) {
            console.log("🛠️ Admin account detected, using Native Backend Login...");
            const nativeResult = await tryNativeLogin(cleanEmail, cleanPassword);
            if (nativeResult.success) return nativeResult;

            // If native failed, continue to Firebase (maybe they have a Firebase account too)
            console.warn("Native admin login failed, attempting Firebase fallback...");
        }

        try {
            // Strictly use Firebase for authentication
            const fbUser = await loginWithEmail(cleanEmail, cleanPassword);
            const result = await firebaseSync(fbUser);

            if (result.success) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                await fetchData();
                return { success: true, user: result.user };
            }
            return result;
        } catch (error) {
            console.error("Firebase Login Error:", error);

            // If Firebase fails (e.g. user not found), try Native Backend as a LAST RESORT
            // This captures admins who didn't trigger the isDefaultAdmin check or local test accounts
            console.log("🔄 Firebase failed, trying Native Backend Fallback...");
            const fallbackResult = await tryNativeLogin(cleanEmail, cleanPassword);
            if (fallbackResult.success) return fallbackResult;

            return {
                success: false,
                message: error.message?.replace('Firebase: ', '') || "Authentication failed"
            };
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
        try {
            // Strictly use Firebase for registration
            // Create user in Firebase
            const fbUser = await registerWithEmail(email, password, username);

            // Sync with backend including the selected country/industry
            // The extraData parameter was already correctly passed to this function, 
            // but we need to ensure firebaseSync sends it.
            const result = await firebaseSync(fbUser, extraData);

            if (result.success) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                await fetchData();
            }
            return result;
        } catch (error) {
            console.error("Firebase Signup Error:", error);
            const msg = error.code === 'auth/admin-restricted-operation'
                ? "New account signup is temporarily restricted. Please contact support."
                : (error.message?.replace('Firebase: ', '') || "Registration failed");
            return { success: false, message: msg };
        }
    };

    const resetPassword = async (email) => {
        try {
            console.log(`🔄 Sending Reset Link via Backend SMTP for: ${email}`);

            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Reset Link Sent", {
                    description: "Please check your Gmail inbox (and Spam folder)."
                });
                return { success: true };
            } else {
                // If backend fails, try a quick Firebase fallback
                console.warn("⚠️ Backend SMTP failed, trying Firebase fallback...");
                const { sendPasswordReset } = await import('../firebase');
                return await sendPasswordReset(email);
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            return { success: false, message: "Server connection failed." };
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
    const handleCountryChange = async (target) => {
        // Resolve code if name was passed
        let targetParam = target;
        if (targetParam === 'United States' || targetParam === 'USA') targetParam = 'US';
        if (targetParam === 'United Kingdom' || targetParam === 'UK') targetParam = 'GB';

        const found = SUPPORTED_COUNTRIES.find(c => c.code === targetParam || c.name === targetParam);
        const countryCode = found ? found.code : targetParam;

        // CRITICAL: Only proceed if country actually changed 
        // This prevents the 0.5s reset loop you are seeing
        if (countryCode !== country) {
            setCountry(countryCode);
            localStorage.setItem('country', countryCode);

            // Reset selection only when changing countries
            setGeoSettings(prev => ({ ...prev, targetState: '' }));
            console.log(`🌍 Country changed to ${countryCode}, resetting selection.`);
        }

        // Load regions (this handles its own sync check internally)
        await loadRegionsForCountry(countryCode);

        const defaults = getCountryDefaults(countryCode);
        if (defaults) {
            setCurrency(defaults.currency, false);
            setLanguage(defaults.language, false);
            setIsCurrencyOverridden(false);
            setIsLanguageOverridden(false);
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
                    radius_areas_count: s.radiusAreasCount,
                    state_code: s.stateCode,
                    country_code: s.countryCode,
                    fips: s.fips,
                    density_mi: s.densityMi,
                    rank: s.rank,
                    population_percent: s.populationPercent
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
                let errMsg = responseData.detail || responseData.error || 'Failed to create campaign';
                if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map(e => {
                        const field = e.loc ? e.loc[e.loc.length - 1] : 'Field';
                        return `${field}: ${e.msg}`;
                    }).join(', ');
                }
                throw new Error(errMsg);
            }

            toast.success('Campaign Created', { description: `"${campaign.name}" submitted for review.` });
            fetchData(); // Refresh all data
            return responseData;
        } catch (error) {
            console.error("addCampaign failed:", error);

            // Handle specific "Not authenticated" error with better UI guidance
            if (error.message.includes('authenticated') || error.message.includes('credentials') || error.message.includes('401')) {
                console.warn("🛡️ Auth error detected, clearing invalid session...");
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                setUser(null);

                toast.error("Session Expired", {
                    description: "Your session has expired. Please log in again to continue."
                });
            } else {
                toast.error("Action Failed", { description: error.message });
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

    const initiatePayment = async (campaignId, targetCurrency) => {
        try {
            toast.loading("Initializing secure checkout...");

            const requestBody = {
                campaign_id: Number(campaignId),
                success_url: `${window.location.origin}/dashboard?payment=success`,
                cancel_url: `${window.location.origin}/create-campaign?payment=cancelled`,
                currency: targetCurrency || currency
            };

            const res = await fetch(`${API_BASE_URL}/payment/create-checkout-session`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            setTimeout(() => toast.dismiss(), 500);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.group("💳 Payment Initialization Error");
                console.error("Status:", res.status);
                console.error("Details:", errorData);
                console.groupEnd();

                // Extract descriptive error
                const backendError = errorData.detail || errorData.error;

                if (res.status === 422 && errorData.error && Array.isArray(errorData.details)) {
                    const msg = errorData.details.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
                    throw new Error(`Data Validation Error: ${msg}`);
                }

                throw new Error(backendError || 'Secure checkout could not be initiated. Please verify your Stripe account settings.');
            }

            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                throw new Error("No secure checkout link received from server.");
            }
        } catch (error) {
            toast.dismiss();
            console.error("Payment Error:", error);
            toast.error(`Payment Failed: ${error.message}`);
        }
    };
    const saveGeoSettings = (newSettings) => {
        const settingsWithTime = { ...newSettings, lastUpdated: new Date().toISOString() };
        setGeoSettings(settingsWithTime);
        localStorage.setItem('geo_settings', JSON.stringify(settingsWithTime));
        toast.success(t('geo.settings_saved'));
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
            paymentConfig,
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
            geoSettings,
            saveGeoSettings,

            markAllRead,
            logout,
            login,
            signup,
            resetPassword,
            googleAuth,
            authLoading,
            isGeoLoading,
            loadRegionsForCountry,
            API_BASE_URL,
            getAuthHeaders
        }}>
            {children}
        </AppContext.Provider>
    );
};

