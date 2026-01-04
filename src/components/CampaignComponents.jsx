import React from 'react';

/**
 * StatusBadge Component
 * Dunders the status with appropriate colors and animations.
 */
const StatusBadge = ({ status }) => {
    const styles = {
        draft: 'bg-slate-700/50 text-slate-400 border-slate-600',
        review: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
    };

    const labels = {
        draft: 'Draft',
        review: 'Review',
        approved: 'Approved',
        live: 'Live'
    };

    const statusKey = status.toLowerCase();

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
      transition-all duration-300 ${styles[statusKey] || styles.draft}
    `}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusKey === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
            {labels[statusKey] || status}
        </span>
    );
};

/**
 * CampaignList Component
 * A detailed list of campaigns with status indicators.
 */
export const CampaignList = ({ campaigns }) => {
    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
                No campaigns found. Start by creating a new one.
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-700/50">
                        <tr>
                            <th className="px-6 py-4">Campaign Name</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Budget</th>
                            <th className="px-6 py-4 text-right">Start Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {campaigns.map((campaign) => (
                            <tr
                                key={campaign.id}
                                className="group hover:bg-slate-800/30 transition-colors duration-150 cursor-pointer"
                            >
                                <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white transition-colors">
                                    {campaign.name}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={campaign.status} />
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-mono">
                                    ${campaign.budget.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500">
                                    {new Date(campaign.startDate).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/**
 * ActivityFeed Component
 * Displays a list of recent activities with iconic indicators.
 */
export const ActivityFeed = ({ activities }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'approval':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                );
            case 'review':
                return (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                );
            case 'payment':
                return (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 text-slate-400 flex items-center justify-center border border-slate-600/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="shrink-0 mt-0.5">
                        {getIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                            {activity.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {activity.time}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
