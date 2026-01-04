import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    Map,
    CreditCard,
    BarChart3,
    LogOut,
    X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
    const { sidebarOpen, setSidebarOpen, logout } = useApp();

    // Close sidebar on route change (mobile)
    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/campaigns/new", icon: PlusCircle, label: "Create Campaign" },
        { to: "/geo-targeting", icon: Map, label: "Geo-Targeting" },
        { to: "/pricing", icon: CreditCard, label: "Pricing & Billing" },
        { to: "/analytics", icon: BarChart3, label: "Analytics" },
    ];

    const activeClass = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 text-primary-light border-l-2 border-accent shadow-[0_0_15px_rgba(30,64,175,0.3)] transition-all";
    const inactiveClass = "flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl transition-all hover:pl-5";

    return (
        <>
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                w-64 fixed left-4 top-4 bottom-4 h-[calc(100vh-2rem)] bg-background-elevated/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl z-50 flex flex-col shadow-2xl shadow-black/50
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        AdPlatform
                    </div>
                    {/* Close Button (Mobile) */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 md:hidden"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleNavClick}
                            className={({ isActive }) => {
                                // For root path, exact match, for others, partial
                                if (item.to === "/" && window.location.pathname !== "/") return inactiveClass;
                                return isActive ? activeClass : inactiveClass;
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / User */}
                <div className="p-4 border-t border-slate-700/50">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-xl w-full transition-all active:scale-95"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
