import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CampaignCreation from './pages/CampaignCreation';
import GeoTargeting from './pages/GeoTargeting';
import Pricing from './pages/Pricing';
import Analytics from './pages/Analytics';
import AdminPricing from './pages/AdminPricing';

import { Toaster } from 'sonner';

import { useApp } from './context/AppContext';
import Login from './pages/Login';

const AdminGuard = ({ children }) => {
    const { user } = useApp();
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
};

const MainLayout = ({ children }) => {
    const { user } = useApp();
    const isAuthenticated = !!user;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-background selection:bg-primary/30 selection:text-primary-light overflow-x-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 max-w-full ml-0 md:ml-72 transition-all duration-300 overflow-x-hidden">
                <Header />
                <main className="flex-1 p-4 md:p-8 pt-4 pb-12 w-full max-w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Toaster position="top-right" richColors closeButton theme="dark" />
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
                                <Route path="/admin/pricing" element={
                                    <AdminGuard>
                                        <AdminPricing />
                                    </AdminGuard>
                                } />
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

