import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCountryDefaults, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '../config/i18nConfig';

import { toast } from 'sonner';

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
    const [user, setUser] = useState(null);

    const API_BASE_URL = '/api';

    const fetchData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        try {
            // Fetch basic data in parallel
            const [statsRes, campaignsRes, notifRes] = await Promise.all([
                fetch(`${API_BASE_URL}/stats`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/campaigns`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/notifications`, { credentials: 'include' })
            ]);

            // Clear session if any core request is unauthorized
            if (statsRes.status === 401 || campaignsRes.status === 401) {
                if (localStorage.getItem('user')) {
                    console.warn("Session expired. Clearing local user data.");
                    localStorage.removeItem('user');
                    setUser(null);
                    // Only redirect if we are not already on the login page
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

        } catch (error) {
            console.error("Failed to fetch data from API:", error);
        }
    };

    // Fetch initial data from API
    useEffect(() => {
        fetchData();

        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                await fetchData(); // Refresh data immediately
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: "System Offline" };
        }
    };

    const signup = async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Signup Error:", error);
            return { success: false, message: "System Offline" };
        }
    };

    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('en');
    const [country, setCountry] = useState('US');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Dynamic Pricing Data
    const pricingData = {
        industries: [
            { name: "Tyres and wheels", multiplier: 1 },
            { name: "Vehicle servicing and maintenance", multiplier: 2 },
            { name: "Panel beating and smash repairs", multiplier: 3 },
            { name: "Automotive finance solutions", multiplier: 4 },
            { name: "Vehicle insurance products", multiplier: 3 },
            { name: "Auto parts, tools, and accessories", multiplier: 1 },
            { name: "Fleet management tools", multiplier: 2 },
            { name: "Workshop technology and equipment", multiplier: 2 },
            { name: "Telematics systems and vehicle tracking solutions", multiplier: 2 },
            { name: "Fuel cards and fuel management services", multiplier: 1 },
            { name: "Vehicle cleaning and detailing services", multiplier: 1 },
            { name: "Logistics and scheduling software", multiplier: 2 },
            { name: "Safety and compliance solutions", multiplier: 1 },
            { name: "Driver training and induction programs", multiplier: 1 },
            { name: "Roadside assistance programs", multiplier: 1 },
            { name: "GPS navigation and route optimisation tools", multiplier: 2 },
            { name: "EV charging infrastructure and electric vehicle solutions", multiplier: 1 },
            { name: "Mobile device integration and communications equipment", multiplier: 1 },
            { name: "Asset recovery and anti-theft technologies", multiplier: 2 }
        ],
        adTypes: [
            { name: "Mobile Leaderboard", baseRate: 125 },
            { name: "Medium Rectangle", baseRate: 150 },
            { name: "Leaderboard (Header)", baseRate: 180 },
            { name: "Leaderboard (Footer)", baseRate: 100 },
            { name: "Skyscraper", baseRate: 150 }
        ],
        discounts: {
            state: 0.15,
            national: 0.30
        },
        states: [
            { name: "California", landMass: 155779, densityMultiplier: 1.2 },
            { name: "Texas", landMass: 261232, densityMultiplier: 1.0 },
            { name: "Florida", landMass: 53625, densityMultiplier: 1.2 },
            { name: "New York", landMass: 47126, densityMultiplier: 1.2 },
            { name: "Pennsylvania", landMass: 44743, densityMultiplier: 1.0 },
            { name: "Illinois", landMass: 55519, densityMultiplier: 1.0 },
            { name: "Ohio", landMass: 40861, densityMultiplier: 1.0 },
            { name: "Georgia", landMass: 57513, densityMultiplier: 1.0 },
            { name: "North Carolina", landMass: 48618, densityMultiplier: 1.0 },
            { name: "Michigan", landMass: 56539, densityMultiplier: 1.0 },
            { name: "Wyoming", landMass: 97093, densityMultiplier: 0.8 },
            { name: "Montana", landMass: 145546, densityMultiplier: 0.8 }
        ]
    };

    const CONSTANTS = {
        COUNTRIES: SUPPORTED_COUNTRIES,
        CURRENCIES: SUPPORTED_CURRENCIES,
        LANGUAGES: SUPPORTED_LANGUAGES
    };

    const addCampaign = async (campaign) => {
        try {
            const response = await fetch(`${API_BASE_URL}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(campaign)
            });

            if (response.ok) {
                const newCamp = await response.json();

                // Ensure the new campaign is added to the local state immediately
                const formattedNewCamp = {
                    ...newCamp,
                    startDate: newCamp.start_date || campaign.startDate
                };

                setCampaigns(prev => [formattedNewCamp, ...prev]);

                // Refresh stats and notifications in parallel
                const [statsRes, notifRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/stats`, { credentials: 'include' }),
                    fetch(`${API_BASE_URL}/notifications`, { credentials: 'include' })
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
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create campaign");
            }
        } catch (error) {
            console.error("API Error:", error);
            toast.error("Sync Error", { description: error.message || "Campaign not saved to backend." });
            throw error;
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read`, {
                method: 'POST',
                credentials: 'include'
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem('user');
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
            setCountry,
            sidebarOpen,
            setSidebarOpen,
            CONSTANTS,
            pricingData,
            addCampaign,
            markAllRead,
            logout,
            login,
            signup
        }}>
            {children}
        </AppContext.Provider>
    );
};

