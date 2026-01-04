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

    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000/api'
        : '/api';

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
