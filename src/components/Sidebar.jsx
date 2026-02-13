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
    Settings,
    ShieldCheck,
    ShieldAlert,
    Shield,
    HelpCircle,
    Users
} from 'lucide-react';
import { Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Dropdown from './Dropdown';

const Sidebar = () => {
    const { sidebarOpen, setSidebarOpen, logout, user, t, detectedCountry, country, setCountry, language, setLanguage, currency, setCurrency, CONSTANTS } = useApp();

    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const advertiserNavItems = [
        { to: "/", icon: LayoutDashboard, label: t('sidebar.dashboard') },
        { to: "/campaigns/new", icon: PlusCircle, label: t('sidebar.new_campaign') },
        { to: "/geo-targeting", icon: Map, label: t('sidebar.geo_targeting') },
        { to: "/pricing", icon: CreditCard, label: t('sidebar.pricing') },
        { to: "/analytics", icon: BarChart3, label: t('sidebar.analytics') },
        { to: "/faq", icon: HelpCircle, label: 'Insights & FAQ' },
    ];

    const adminNavItems = [
        { to: "/", icon: LayoutDashboard, label: 'Admin Dashboard' },
        { to: "/admin/campaigns", icon: Shield, label: 'Campaign Approvals' },
        { to: "/admin/pricing", icon: Settings, label: t('sidebar.admin_pricing') },
        { to: "/admin/users", icon: Users, label: 'User Directory' },
        { to: "/geo-targeting", icon: Map, label: t('sidebar.geo_targeting') },
    ];

    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'country_admin';
    const currentNavItems = isAdmin ? adminNavItems : advertiserNavItems;

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
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tighter leading-none mb-0.5 text-white">RULE 7</span>
                            <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">MEDIA</span>
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

                {/* Live Mode Indicator */}
                <div className="mx-6 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-500 text-[10px] font-bold uppercase tracking-wider text-center mb-2 animate-pulse">
                    LIVE MODE (Production)
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-4 pl-2">{(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'country_admin') ? 'Administration' : t('sidebar.menu')}</p>
                    {currentNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleNavClick}
                            className={({ isActive }) => {
                                if (item.to === "/" && window.location.pathname !== "/") return inactiveClass;
                                if (isActive && item.to === "/geo-targeting") {
                                    return "flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl bg-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)] transition-all scale-[1.02]";
                                }
                                return isActive ? activeClass : inactiveClass;
                            }}
                        >
                            <item.icon size={22} className={(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'country_admin') && item.to !== '/' ? 'text-amber-500' : (item.to === '/geo-targeting' ? 'text-blue-400' : '')} />
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Geo-Blocking Status (Only for Advertisers or if specifically needed for admin overview) */}
                    {user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'country_admin' && (
                        <div className="pt-8 px-2">
                            <div className={`p-4 rounded-3xl border ${detectedCountry && detectedCountry !== country ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {detectedCountry && detectedCountry === country ? (
                                        <ShieldCheck className="text-blue-500" size={18} />
                                    ) : (
                                        <ShieldAlert className="text-red-500" size={18} />
                                    )}
                                    <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest">{t('sidebar.geo_status')}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-500">{t('sidebar.ip_detected')}</span>
                                        <span className={`${detectedCountry ? 'text-blue-400 font-extrabold' : 'text-amber-400 animate-pulse'}`}>{detectedCountry || "Pending Activation"}</span>
                                    </div>
                                    {(!detectedCountry) && (
                                        <p className="text-[8px] text-slate-600 italic mt-0.5 animate-pulse">Activates upon production launch</p>
                                    )}
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-blue-500/60 font-black uppercase tracking-tighter text-[10px]">{t('sidebar.profile_label')}</span>
                                        <span className="text-slate-200">{country}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile Settings (Visible ONLY on small screens where Header hides them) */}
                    <div className="pt-8 px-2 lg:hidden">
                        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('common.country_context')}</p>
                            <div className="space-y-3">
                                <Dropdown
                                    label="Country"
                                    options={CONSTANTS.COUNTRIES}
                                    value={country}
                                    onChange={setCountry}
                                    align="top"
                                    icon={<Globe size={14} />}
                                    className="w-full"
                                    menuWidth="w-full"
                                />
                                <div className="flex flex-col gap-3">
                                    <Dropdown
                                        label="Language"
                                        options={CONSTANTS.LANGUAGES}
                                        value={language}
                                        onChange={setLanguage}
                                        align="top"
                                        icon={<span className="text-xs font-bold uppercase">{language}</span>}
                                        className="w-full"
                                        menuWidth="w-full"
                                    />
                                    <Dropdown
                                        label="Currency"
                                        options={CONSTANTS.CURRENCIES}
                                        value={currency}
                                        onChange={setCurrency}
                                        align="top"
                                        icon={<span className="font-mono text-xs font-bold">{CONSTANTS.CURRENCIES.find(c => c.code === currency)?.symbol}</span>}
                                        className="w-full"
                                        menuWidth="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{t('sidebar.end_session')}</p>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

