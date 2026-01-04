import React, { useState } from 'react';
import { CAMPAIGN_STATUS, getStatusBadge } from '../config/workflowConfig';

/**
 * Action Center Component
 * Shows pending approvals, rejected campaigns, and quick actions
 */

const AlertCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const EditIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const StatusBadge = ({ status }) => {
    const config = getStatusBadge(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
};

const ActionItem = ({ campaign, onApprove, onReject, onEdit }) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleReject = () => {
        if (feedback.trim()) {
            onReject(campaign.id, feedback);
            setShowFeedback(false);
            setFeedback('');
        }
    };

    return (
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-white truncate">{campaign.name}</h4>
                        <StatusBadge status={campaign.status} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <span>Type: {campaign.type}</span>
                        <span>•</span>
                        <span>Budget: ${campaign.budget?.toLocaleString()}</span>
                        {campaign.rejectionReason && (
                            <>
                                <span>•</span>
                                <span className="text-red-400">Rejected</span>
                            </>
                        )}
                    </div>

                    {/* Rejection Reason */}
                    {campaign.rejectionReason && (
                        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs font-semibold text-red-400 mb-1">Rejection Reason:</p>
                            <p className="text-xs text-red-300">{campaign.rejectionReason}</p>
                        </div>
                    )}

                    {/* Feedback Input for Rejection */}
                    {showFeedback && (
                        <div className="mb-3">
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Provide feedback for rejection..."
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows="3"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {campaign.status === CAMPAIGN_STATUS.IN_REVIEW && (
                            <>
                                <button
                                    onClick={() => onApprove(campaign.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Approve
                                </button>
                                {!showFeedback ? (
                                    <button
                                        onClick={() => setShowFeedback(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all"
                                    >
                                        <AlertCircleIcon className="w-4 h-4" />
                                        Reject
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleReject}
                                            disabled={!feedback.trim()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition-all"
                                        >
                                            Submit Rejection
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowFeedback(false);
                                                setFeedback('');
                                            }}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {campaign.status === CAMPAIGN_STATUS.REJECTED && (
                            <button
                                onClick={() => onEdit(campaign.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                                <EditIcon />
                                Edit & Resubmit
                            </button>
                        )}

                        {campaign.status === CAMPAIGN_STATUS.APPROVED && (
                            <button
                                onClick={() => onEdit(campaign.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                                Activate Campaign
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ActionCenter = ({ campaigns = [], onApprove, onReject, onEdit }) => {
    const pendingReview = campaigns.filter(c => c.status === CAMPAIGN_STATUS.IN_REVIEW);
    const rejected = campaigns.filter(c => c.status === CAMPAIGN_STATUS.REJECTED);
    const approved = campaigns.filter(c => c.status === CAMPAIGN_STATUS.APPROVED);

    const totalActions = pendingReview.length + rejected.length + approved.length;

    if (totalActions === 0) {
        return null;
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertCircleIcon className="text-amber-400" />
                        Action Center
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {totalActions} {totalActions === 1 ? 'item' : 'items'} requiring attention
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {/* Pending Review */}
                {pendingReview.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                            Pending Review ({pendingReview.length})
                        </h3>
                        <div className="space-y-2">
                            {pendingReview.map(campaign => (
                                <ActionItem
                                    key={campaign.id}
                                    campaign={campaign}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    onEdit={onEdit}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Rejected Campaigns */}
                {rejected.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 mt-6">
                            Rejected - Needs Revision ({rejected.length})
                        </h3>
                        <div className="space-y-2">
                            {rejected.map(campaign => (
                                <ActionItem
                                    key={campaign.id}
                                    campaign={campaign}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    onEdit={onEdit}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Approved - Ready to Activate */}
                {approved.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 mt-6">
                            Approved - Ready to Activate ({approved.length})
                        </h3>
                        <div className="space-y-2">
                            {approved.map(campaign => (
                                <ActionItem
                                    key={campaign.id}
                                    campaign={campaign}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    onEdit={onEdit}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionCenter;
