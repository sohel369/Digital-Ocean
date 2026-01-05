import React from 'react';
import { useApp } from '../context/AppContext';
import {
    Activity,
    MousePointer2,
    Eye,
    TrendingUp,
    Plus,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const sparklineData = [
    { v: 40 }, { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }, { v: 40 }, { v: 60 }
];

const StatCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="glass-panel p-6 rounded-[2rem] overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-${colorClass}/10 text-${colorClass}`}>
                <Icon size={24} />
            </div>
            <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trend === 'up' ? '#10b981' : '#3b82f6'} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={trend === 'up' ? '#10b981' : '#3b82f6'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke={trend === 'up' ? '#10b981' : '#3b82f6'}
                            strokeWidth={2}
                            fill={`url(#grad-${title})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-slate-400 text-sm font-medium tracking-wide uppercase">{title}</h3>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-white">{value}</p>
                {trend && (
                    <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {trend === 'up' ? '↑ 12%' : '↓ 3%'}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{subtext}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { stats, campaigns, notifications, user } = useApp();

    const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
    const pendingCampaigns = campaigns.filter(c => c.status === 'review').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Advertiser <span className="text-primary">Dashboard</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Monitoring {activeCampaigns} active campaigns across your region.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full md:w-64"
                        />
                    </div>
                    <button className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors">
                        <Filter size={20} />
                    </button>
                    <Link to="/campaigns/new" className="premium-btn px-6 py-2.5 rounded-2xl text-sm">
                        <Plus size={18} /> New Campaign
                    </Link>
                </div>
            </div>

            {/* Stats Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Active Campaigns"
                    value={activeCampaigns || 0}
                    subtext={`${pendingCampaigns || 0} pending`}
                    icon={Activity}
                    colorClass="blue-500"
                />
                <StatCard
                    title="Impressions"
                    value={`${((stats?.impressions || 0) / 1000).toFixed(1)}K`}
                    subtext="+2.4k today"
                    icon={Eye}
                    trend="up"
                    colorClass="emerald-500"
                />
                <StatCard
                    title="Total Clicks"
                    value={Math.floor((stats?.impressions || 0) * 0.024).toLocaleString()}
                    subtext="Avg. 2.4% CTR"
                    icon={MousePointer2}
                    trend="up"
                    colorClass="blue-400"
                />
                <StatCard
                    title="Current CTR"
                    value={`${stats?.ctr || 0}%`}
                    subtext="Target: 3.5%"
                    icon={TrendingUp}
                    trend="down"
                    colorClass="indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Performance Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Recent <span className="text-primary font-black">Campaigns</span>
                        </h2>
                        <Link to="/campaigns" className="text-sm font-bold text-primary hover:text-primary-light flex items-center gap-1 transition-colors">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="glass-panel rounded-[2rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/30">
                                        <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Campaign Name</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Engagement</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Budget</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {campaigns.slice(0, 5).map((camp) => (
                                        <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary-light font-bold">
                                                        {camp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-100 group-hover:text-primary transition-colors">{camp.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: #{1000 + camp.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                                            style={{ width: `${Math.random() * 60 + 20}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">Performance</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {camp.status === 'live' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                            Live
                                                        </span>
                                                    ) : camp.status === 'review' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase">
                                                            <Clock size={12} />
                                                            Review
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-full text-[10px] font-bold uppercase">
                                                            <AlertCircle size={12} />
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-100 italic">
                                                ${camp.budget.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Approvals & Activity */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white px-2">
                        Approval <span className="text-primary font-black">Status</span>
                    </h2>

                    <div className="glass-panel rounded-[2rem] p-6 space-y-4">
                        {notifications.slice(0, 4).map((n, i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800 cursor-help">
                                <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'approval' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {n.type === 'approval' ? <CheckCircle2 size={20} /> : <TrendingUp size={20} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200 line-clamp-1">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">{n.time} • Rule 7 AdOps</p>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 mt-2 border-t border-slate-800">
                            <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-4 border border-primary/10">
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">Creative Tip</p>
                                    <p className="text-[11px] text-slate-500 font-medium">Use high-contrast images for 2x CTR results.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Ad Preview Mock */}
                    <div className="glass-panel rounded-[2rem] p-6 bg-gradient-to-br from-slate-900/50 to-primary/5 border-primary/10">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Performing Creative</h3>
                        <div className="aspect-video rounded-2xl bg-slate-800 mb-4 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                                alt="Top Ad"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-slate-950 to-transparent">
                                <p className="text-sm font-black text-white italic tracking-tighter">PREMIUM VEHICLE DEALS</p>
                                <p className="text-[10px] text-primary-light font-bold">2.8% Conversion Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

