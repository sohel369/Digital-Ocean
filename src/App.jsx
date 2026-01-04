import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CampaignCreation from './pages/CampaignCreation';
import GeoTargeting from './pages/GeoTargeting';
import Pricing from './pages/Pricing';
import Analytics from './pages/Analytics';

import { Toaster } from 'sonner';

import Login from './pages/Login';

const MainLayout = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('user');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-background selection:bg-primary/30 selection:text-primary-light">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-[288px] transition-all duration-300">
                <Header />
                <main className="p-4 md:ml-8 md:p-8 pt-4 pb-12 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Toaster position="top-right" richColors closeButton />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/*"
                    element={
                        <MainLayout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/campaigns/new" element={<CampaignCreation />} />
                                <Route path="/geo-targeting" element={<GeoTargeting />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </MainLayout>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
