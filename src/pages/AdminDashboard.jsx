import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Activity,
    Shield,
    Users,
    TrendingUp,
    Clock,
    CheckCircle2,
    Search,
    RefreshCw,
    Settings,
    ChevronRight,
    DollarSign,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminStatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${colorClass}/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-${colorClass}/10`} />

        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl bg-${colorClass}/10 text-${colorClass} shadow-lg shadow-${colorClass}/5`}>
                <Icon size={24} />
            </div>
            <Activity size={16} className="text-slate-700 opacity-50" />
        </div>

        <div className="space-y-1 relative z-10 min-w-0">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] truncate">{title}</h3>
            <p className="text-2xl min-[400px]:text-3xl font-black text-white italic tracking-tighter truncate">{value}</p>
            <p className="text-[10px] min-[400px]:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{subtext}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { stats, t, formatCurrency, API_BASE_URL, getAuthHeaders } = useApp();
    const [pendingCount, setPendingCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchAdminContext = async () => {
        try {
            setLoading(true);
            const [pendingRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/campaigns/approval/pending`, { headers: { ...getAuthHeaders() } }),
                // Assuming there's an endpoint for users, if not, we use mock or omit
                fetch(`${API_BASE_URL}/admin/users/count`, { headers: { ...getAuthHeaders() } }).catch(() => ({ ok: false }))
            ]);

            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingCount(pendingData.length);
            }

            if (usersRes.ok) {
                const userData = await usersRes.json();
                setUserCount(userData.count || 0);
            } else {
                setUserCount('--'); // Fallback if no endpoint
            }
        } catch (error) {
            console.error('Error fetching admin context:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminContext();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                            System Authority
                        </div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase leading-none">
                        Admin <span className="text-primary">Command</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-sm sm:text-base mt-2">Platform-wide overview and operational controls.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link to="/admin/pricing" className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800/50 transition-all border border-white/5 group">
                        <Settings size={18} className="text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">Global Config</span>
                    </Link>
                    <button
                        onClick={fetchAdminContext}
                        className="p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <AdminStatCard
                    title="Platform Revenue"
                    value={formatCurrency(stats?.totalSpend || 0)}
                    subtext="Gross Validated Revenue"
                    icon={DollarSign}
                    colorClass="emerald-500"
                />
                <AdminStatCard
                    title="System Reach"
                    value={`${((stats?.impressions || 0) / 1000).toFixed(1)}K`}
                    subtext="Total Impressions Distributed"
                    icon={TrendingUp}
                    colorClass="blue-500"
                />
                <AdminStatCard
                    title="Pending Approvals"
                    value={pendingCount}
                    subtext="Actions Required in Queue"
                    icon={Clock}
                    colorClass="amber-500"
                />
                <AdminStatCard
                    title="Network Status"
                    value="ACTIVE"
                    subtext="All Systems Operational"
                    icon={Zap}
                    colorClass="primary"
                />
            </div>

            {/* Admin Action Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Approvals Quick View */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic tracking-tight">
                            Critical <span className="text-primary font-black">Queue</span>
                        </h2>
                        <Link to="/admin/campaigns" className="text-xs font-black text-primary hover:text-white flex items-center gap-2 transition-all uppercase tracking-widest">
                            Manager Queue <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="glass-panel rounded-[2.5rem] p-10 text-center border border-white/5 bg-slate-900/20">
                        {pendingCount > 0 ? (
                            <div className="space-y-6">
                                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
                                    <Clock className="text-amber-500" size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase">{pendingCount} Items Waiting</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                    New campaign initiatives require validation before deployment to the network.
                                </p>
                                <Link
                                    to="/admin/campaigns"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/20"
                                >
                                    Initiate Review Matrix <ChevronRight size={20} />
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
                                    <CheckCircle2 className="text-emerald-500" size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase text-emerald-400">Queue Clear</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                    All campaign initiatives have been processed. Systems are running at optimal latency.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Controls */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white px-2 uppercase italic tracking-tight">
                        Power <span className="text-primary font-black">Controls</span>
                    </h2>

                    <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Platform Management</h3>
                            <Link to="/admin/pricing" className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Settings size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-200">Global Pricing Setup</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors" />
                            </Link>
                            <Link to="/admin/campaigns" className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Shield size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-200">Campaign Validation</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors" />
                            </Link>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Zap size={18} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Tip</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    Keep your pricing matrix updated to reflect current market demand and geo-density weights.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
