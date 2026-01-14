import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    Map,
    CreditCard,
    BarChart3,
    LogOut,
    X,
    Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
    const { sidebarOpen, setSidebarOpen, logout, user, t } = useApp();

    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: t('sidebar.dashboard') },
        { to: "/campaigns/new", icon: PlusCircle, label: t('sidebar.new_campaign') },
        { to: "/geo-targeting", icon: Map, label: t('sidebar.geo_targeting') },
        { to: "/pricing", icon: CreditCard, label: t('sidebar.pricing') },
        { to: "/analytics", icon: BarChart3, label: t('sidebar.analytics') },
    ];

    const activeClass = "flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl bg-primary text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)] transition-all scale-[1.02]";
    const inactiveClass = "flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-400 hover:text-slate-200 rounded-2xl transition-all hover:bg-slate-800/40 hover:pl-6";

    return (
        <>
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                w-64 fixed left-1 md:left-4 top-4 bottom-4 h-[calc(100vh-2rem)] bg-slate-950 border border-white/5 md:rounded-[2.5rem] z-50 flex flex-col shadow-2xl
                transition-transform duration-500 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
            `}>
                {/* Logo Section */}
                <div className="h-28 flex flex-col justify-center px-8 border-b border-white/5">
                    <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            <span className="text-xl italic">R</span>
                        </div>
                        <div className="flex flex-col -space-y-1">
                            <span>RULE 7</span>
                            <span className="text-xs font-bold text-primary tracking-widest opacity-80">MEDIA</span>
                        </div>
                    </div>
                    {/* Close Button (Mobile) */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-8 right-6 p-1 text-slate-500 hover:text-white md:hidden"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pl-2">Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleNavClick}
                            className={({ isActive }) => {
                                if (item.to === "/" && window.location.pathname !== "/") return inactiveClass;
                                return isActive ? activeClass : inactiveClass;
                            }}
                        >
                            <item.icon size={22} />
                            {item.label}
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <div className="pt-8">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pl-2">System</p>
                            <NavLink
                                to="/admin/pricing"
                                onClick={handleNavClick}
                                className={inactiveClass}
                            >
                                <Settings size={22} className="text-slate-500" />
                                {t('sidebar.admin_pricing')}
                            </NavLink>
                        </div>
                    )}
                </nav>


                {/* Footer User Profile */}
                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="group flex items-center gap-4 p-3 hover:bg-red-500/10 rounded-2xl w-full transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <LogOut size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-100 italic">{t('sidebar.logout')}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">End Session</p>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

