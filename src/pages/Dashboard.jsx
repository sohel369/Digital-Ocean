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
    Search,
    XCircle,
    MessageSquare,
    PartyPopper
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const sparklineData = [
    { v: 40 }, { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }, { v: 40 }, { v: 60 }
];

const StatCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="glass-panel p-5 sm:p-6 rounded-[2rem] overflow-hidden group h-full">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 sm:p-3 rounded-2xl bg-${colorClass}/10 text-${colorClass} shrink-0`}>
                <Icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="h-8 w-16 sm:h-10 sm:w-24">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trend === 'up' ? '#3B82F6' : '#2563EB'} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={trend === 'up' ? '#3B82F6' : '#2563EB'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke={trend === 'up' ? '#3B82F6' : '#2563EB'}
                            strokeWidth={2}
                            fill={`url(#grad-${title})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-slate-400 text-[10px] sm:text-xs font-bold tracking-[0.1em] uppercase truncate" title={title}>{title}</h3>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tighter truncate max-w-full" title={typeof value === 'string' ? value : ''}>{value}</p>
                {trend && (
                    <span className={`text-[10px] sm:text-xs font-black italic ${trend === 'up' ? 'text-blue-400' : 'text-primary-light'}`}>
                        {trend === 'up' ? '↑ 12%' : '↓ 3%'}
                    </span>
                )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate opacity-80" title={subtext}>{subtext}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { stats, campaigns, notifications, user, formatCurrency, t, initiatePayment, currency } = useApp();
    const [searchParams] = React.useState(new URLSearchParams(window.location.search));

    React.useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            // Ideally use a toast library here if available in context, otherwise alert or console
            // Check if we have toast in window or context. AppContext doesn't export toast directly but uses it.
            // We can import it from sonner if it's used in the project.
            // Assuming standard approach:
            const successMsg = t('payment.success') || "Payment Successful! Campaign is now pending approval.";
            // We'll rely on the fact that AppContext might trigger a refresh, 
            // but let's just use a simple browser API or rely on the user seeing the 'Pending' status.
            // Actually, let's see if we can use the toast from 'sonner' which seems to be used in other files.
            import('sonner').then(({ toast }) => {
                toast.success(successMsg);
            });
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const activeCampaignsCount = campaigns.filter(c => ['live', 'active', 'approved'].includes(c.status)).length;
    const pendingCampaignsCount = campaigns.filter(c => ['pending_review', 'submitted'].includes(c.status)).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Admin Feedback Banners */}
            <div className="space-y-4">
                {/* Approved Campaign Banner */}
                {campaigns.filter(c => c.status === 'approved').map(camp => (
                    <div key={camp.id} className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span>Campaign Approved!</span>
                                        <span className="text-emerald-400">🎉</span>
                                        <span className="text-slate-400">—</span>
                                        <span className="text-emerald-300">{camp.name}</span>
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {camp.reviewed_at ? new Date(camp.reviewed_at).toLocaleDateString() : 'Recently'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    <span className="font-bold text-emerald-300">Admin Message:</span> "{camp.admin_message || 'Your campaign has been approved and is now active.'}"
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Link to={`/campaigns/new/${camp.id}`} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors">
                                        View Campaign
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Rejected / Changes Required Campaign Banners */}
                {campaigns.filter(c => c.status === 'changes_required' || c.status === 'rejected').map(camp => (
                    <div key={camp.id} className={`p-4 rounded-2xl border ${camp.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'} animate-in fade-in slide-in-from-top-2 duration-500`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${camp.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                <AlertCircle size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">
                                        {camp.status === 'rejected' ? 'Campaign Rejected' : 'Changes Required'}: {camp.name}
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {camp.reviewed_at ? new Date(camp.reviewed_at).toLocaleDateString() : 'Recently'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    <span className="font-bold text-slate-300">Admin Feedback:</span> "{camp.admin_message || 'No specific feedback provided.'}"
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Link to={`/campaigns/new/${camp.id}`} className={`px-4 py-1.5 ${camp.status === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'} text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors`}>
                                        {camp.status === 'rejected' ? 'Edit & Resubmit' : 'Update Campaign'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {campaigns.some(c => c.status === 'pending_review') && (
                    <div className="p-4 rounded-2xl border bg-primary/10 border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/20 text-primary-light">
                                <Clock size={20} />
                            </div>
                            <p className="text-xs font-medium text-slate-300">
                                Your campaign has been submitted and will be reviewed by admin within 24 hours.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Header / Search Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        {t('dashboard.title')} <span className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{t('dashboard.subtitle')}</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest pl-1">
                        {t('dashboard.monitoring', { count: activeCampaignsCount })}
                        <span className="text-primary-light ml-2 inline-block animate-pulse">●</span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:ml-auto w-full lg:w-auto">
                    {/* Search Field */}
                    <div className="relative group w-full sm:w-64 h-[52px]">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg group-focus-within:bg-primary/10 transition-all duration-500"></div>
                        <div className="relative flex items-center h-full">
                            <Search className="absolute left-4 text-slate-500 group-hover:text-primary-light group-focus-within:text-primary-light transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                className="w-full h-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/20 transition-all placeholder:text-slate-600 font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Filter Action */}
                        <button className="h-[52px] w-[52px] flex items-center justify-center bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all shrink-0">
                            <Filter size={20} />
                        </button>

                        {/* New Campaign CTA */}
                        <Link to="/campaigns/new" className="premium-btn flex-1 sm:w-56 h-[52px] rounded-2xl text-[10px] sm:text-xs md:text-sm italic font-black flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0">
                            <div className="bg-white/20 p-1 rounded-lg">
                                <Plus size={16} strokeWidth={3} />
                            </div>
                            <span className="tracking-tight uppercase whitespace-nowrap">{t('sidebar.new_campaign')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title={t('dashboard.budget')}
                    value={formatCurrency(stats?.totalSpend || 0)}
                    subtext={t('dashboard.monthly_est') || 'Monthly Estimated'}
                    icon={Activity}
                    colorClass="blue-500"
                />
                <StatCard
                    title="Estimated Population"
                    value={`${((stats?.impressions || 0) / 1000).toFixed(1)}K`}
                    subtext={`Population Target`}
                    icon={Eye}
                    trend="up"
                    colorClass="blue-500"
                />
                <StatCard
                    title={t('dashboard.total_clicks')}
                    value={Math.floor((stats?.impressions || 0) * 0.024).toLocaleString()}
                    subtext={t('dashboard.avg_stats', { val: '2.4%', stat: t('dashboard.performance') })}
                    icon={MousePointer2}
                    trend="up"
                    colorClass="primary-light"
                />
                <StatCard
                    title={t('dashboard.ctr')}
                    value={`${stats?.ctr || 0}%`}
                    subtext={`${t('dashboard.target')}: 3.5%`}
                    icon={TrendingUp}
                    trend="down"
                    colorClass="blue-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Performance Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {t('dashboard.recent_campaigns')} <span className="text-primary font-black">{t('dashboard.recent_campaigns_sub')}</span>
                        </h2>
                        <Link to="/campaigns" className="text-xs font-black text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all group/view bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10">
                            {t('common.view_all')} <ChevronRight size={14} className="group-hover/view:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="glass-panel rounded-[2rem] overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left table-fixed min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/30">
                                        <th className="w-[40%] px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{t('dashboard.campaign_name')}</th>
                                        <th className="w-[20%] px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center italic">{t('dashboard.performance')}</th>
                                        <th className="w-[25%] px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{t('dashboard.status')}</th>
                                        <th className="w-[15%] px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right italic">{t('dashboard.budget')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {campaigns.slice(0, 5).map((camp) => (
                                        <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-primary-light font-black italic shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                                        {camp.name.charAt(0)}
                                                    </div>
                                                    <Link to={`/campaigns/new/${camp.id}`} className="group/name min-w-0">
                                                        <p className="text-sm font-black text-slate-100 italic tracking-tight group-hover/name:text-primary transition-colors truncate">{camp.name.toUpperCase()}</p>
                                                        <p className="text-[9px] text-slate-600 font-black">ID: #{1000 + camp.id}</p>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-full max-w-[100px] h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                                            style={{ width: `${Math.random() * 60 + 20}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-slate-600 font-black mt-1.5 uppercase tracking-tighter">Peak Analytics</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {camp.status === 'live' || camp.status === 'active' || camp.status === 'approved' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shrink-0" />
                                                            LIVE
                                                        </span>
                                                    ) : camp.status === 'pending_review' || camp.status === 'submitted' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest italic cursor-help group/status relative" title="Geo status: Pending activation and network propagation">
                                                            <Clock size={10} className="shrink-0" />
                                                            Pending Activation

                                                            {/* Tooltip for Step 7 */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover/status:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-2xl">
                                                                <p className="font-black text-amber-400 mb-1 uppercase tracking-tighter">Geo Sync Progress</p>
                                                                <p className="font-medium text-slate-400 lowercase">Targeting is being propagated to nodes...</p>
                                                            </div>
                                                        </span>
                                                    ) : camp.status === 'rejected' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest italic group relative" title={camp.admin_message || 'Rejected'}>
                                                            <AlertCircle size={10} className="shrink-0" />
                                                            REJECTED
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700/50 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                                                                <Clock size={10} className="shrink-0" />
                                                                DRAFT
                                                            </span>
                                                            <button
                                                                onClick={() => initiatePayment(camp.id, currency)}
                                                                className="px-3 py-1 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-100 italic tracking-tighter text-sm">
                                                {formatCurrency(camp.budget)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="block sm:hidden divide-y divide-slate-800/50">
                            {campaigns.slice(0, 5).map((camp) => (
                                <Link key={camp.id} to={`/campaigns/new/${camp.id}`} className="flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-primary-light font-black italic shrink-0">
                                            {camp.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-100 italic tracking-tight truncate uppercase">{camp.name}</p>
                                            <p className="text-[10px] text-slate-600 font-bold">{formatCurrency(camp.budget)}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {camp.status === 'live' || camp.status === 'active' || camp.status === 'approved' ? (
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        ) : camp.status === 'pending_review' || camp.status === 'submitted' ? (
                                            <Clock size={16} className="text-amber-500" />
                                        ) : (
                                            <ChevronRight size={16} className="text-slate-700" />
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Approvals & Activity */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white px-2">
                        {t('dashboard.approval_status')} <span className="text-primary font-black">{t('dashboard.approval_status_sub')}</span>
                    </h2>

                    <div className="glass-panel rounded-[2rem] p-6 space-y-4">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p>{t('common.no_data')}</p>
                            </div>
                        ) : (
                            notifications.slice(0, 4).map((n, i) => {
                                const notifType = n.type || n.notification_type || '';
                                const isApproved = notifType.includes('approved');
                                const isRejected = notifType.includes('rejected');
                                const isChanges = notifType.includes('changes');

                                let iconBg = 'bg-primary/10 text-primary-light';
                                let NotifIcon = TrendingUp;

                                if (isApproved) {
                                    iconBg = 'bg-emerald-500/10 text-emerald-400';
                                    NotifIcon = CheckCircle2;
                                } else if (isRejected) {
                                    iconBg = 'bg-red-500/10 text-red-400';
                                    NotifIcon = XCircle;
                                } else if (isChanges) {
                                    iconBg = 'bg-orange-500/10 text-orange-400';
                                    NotifIcon = MessageSquare;
                                }

                                return (
                                    <div key={n.id || i} className={`flex gap-4 p-3 rounded-2xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800 cursor-help ${!n.is_read ? 'bg-slate-800/20 border-l-2 border-l-primary' : ''}`}>
                                        <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                                            <NotifIcon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-200 line-clamp-1">{n.title}</p>
                                            {n.message && (
                                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            )}
                                            <p className="text-[10px] text-slate-600 mt-1 font-bold">{n.time}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div className="pt-4 mt-2 border-t border-slate-800">
                            <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-4 border border-primary/10">
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">{t('dashboard.creative_tip')}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{t('dashboard.creative_tip_text')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Ad Preview Mock */}
                    <div className="glass-panel rounded-[2rem] p-6 bg-gradient-to-br from-slate-900/50 to-primary/5 border-primary/10">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('dashboard.top_performing')}</h3>
                        <div className="aspect-video rounded-2xl bg-slate-800 mb-4 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                                alt="Top Ad"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-slate-950 to-transparent">
                                <p className="text-sm font-black text-white italic tracking-tighter uppercase">{t('dashboard.premium_deals')}</p>
                                <p className="text-[10px] text-primary-light font-bold">{t('dashboard.conversion_rate')}: 2.8%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

