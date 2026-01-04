import React from 'react';
import { useApp } from '../context/AppContext';
import {
    TrendingUp,
    Users,
    MousePointer2,
    Wallet,
    MoreHorizontal,
    Plus,
    Target,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const statsData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
];

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
    <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-primary/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                <Icon size={22} />
            </div>
            {trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {trend === 'up' ? '+12.5%' : '-2.4%'}
                </span>
            )}
        </div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className={`text-2xl font-bold ${title.includes('Spend') ? 'premium-text' : 'text-slate-100'}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-2">{subtext}</p>
    </div>
);

const Dashboard = () => {
    const { stats, campaigns, notifications, user } = useApp();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Intro */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Welcome back, {user?.username || 'Operator'} 👋</h1>
                <p className="text-slate-400 mt-1">Here's what's happening with your campaigns today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Spend"
                    value={`$${stats.totalSpend.toLocaleString()}`}
                    subtext="Last 30 days"
                    icon={Wallet}
                    trend="up"
                />
                <StatCard
                    title="Total Impressions"
                    value={`${(stats.impressions / 1000000).toFixed(1)}M`}
                    subtext="Across all channels"
                    icon={Users}
                    trend="up"
                />
                <StatCard
                    title="Avg. CTR"
                    value={`${stats.ctr}%`}
                    subtext="Industry avg: 2.1%"
                    icon={MousePointer2}
                    trend="down"
                />
                <StatCard
                    title="Budget Remaining"
                    value={`$${stats.budgetRemaining}`}
                    subtext="Reset in 12 days"
                    icon={TrendingUp}
                />
            </div>

            {/* Bento Layout: Main Chart + Side Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart */}
                <div className="lg:col-span-2 glass-panel rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Revenue Overview</h2>
                            <p className="text-xs text-slate-400">Gross earnings per day</p>
                        </div>
                        <select className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions & Activity */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-primary-dark via-primary to-primary-light rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-10 pointer-events-none"></div>
                        <h3 className="text-lg font-bold mb-4 relative z-10">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            <Link to="/campaigns/new" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl transition-colors border border-white/10">
                                <div className="bg-white/20 p-2 rounded-lg"><Plus size={18} /></div>
                                <span className="text-sm font-medium">New Campaign</span>
                            </Link>
                            <Link to="/geo-targeting" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl transition-colors border border-white/10">
                                <div className="bg-white/20 p-2 rounded-lg"><Target size={18} /></div>
                                <span className="text-sm font-medium">Target Audience</span>
                            </Link>
                            <Link to="/pricing" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl transition-colors border border-white/10">
                                <div className="bg-white/20 p-2 rounded-lg"><CreditCard size={18} /></div>
                                <span className="text-sm font-medium">Billing & Plans</span>
                            </Link>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="glass-panel rounded-3xl p-5 shadow-sm h-[240px] overflow-hidden flex flex-col">
                        <h3 className="text-sm font-bold text-slate-100 mb-4 px-1">Recent Activity</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {notifications.map((n, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'approval' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                    <div>
                                        <p className="text-slate-300 font-medium leading-tight">{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Campaigns Table */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-100">Active Campaigns</h2>
                    <Link to="/campaigns/new" className="text-sm text-primary-light hover:text-primary font-medium flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Campaign Name</th>
                                <th className="px-6 py-4">Budget</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {campaigns.map((camp) => (
                                <tr key={camp.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-200">{camp.name}</p>
                                        <p className="text-xs text-slate-500">ID: #{4920 + camp.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-300">${camp.budget.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{camp.startDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${camp.status === 'live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                camp.status === 'review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    camp.status === 'draft' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}
                                        >
                                            {camp.status === 'live' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                                            {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-500 hover:text-slate-200 p-2 rounded-full hover:bg-slate-800 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
