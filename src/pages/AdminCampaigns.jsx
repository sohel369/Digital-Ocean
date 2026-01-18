import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
    Shield,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Clock,
    AlertTriangle,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    Building2,
    Globe,
    DollarSign,
    Calendar,
    User,
    Eye,
    Check,
    X
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending_review: {
            label: 'Pending Review',
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            border: 'border-amber-500/20',
            icon: Clock
        },
        active: {
            label: 'Active',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            border: 'border-emerald-500/20',
            icon: CheckCircle2
        },
        approved: {
            label: 'Approved',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            border: 'border-emerald-500/20',
            icon: CheckCircle2
        },
        rejected: {
            label: 'Rejected',
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            border: 'border-red-500/20',
            icon: XCircle
        },
        changes_required: {
            label: 'Changes Required',
            bg: 'bg-orange-500/10',
            text: 'text-orange-400',
            border: 'border-orange-500/20',
            icon: RefreshCw
        },
        submitted: {
            label: 'Submitted',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            icon: Clock
        },
        draft: {
            label: 'Draft',
            bg: 'bg-slate-500/10',
            text: 'text-slate-400',
            border: 'border-slate-500/20',
            icon: Clock
        }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bg} ${config.text} border ${config.border} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

const AdminCampaigns = () => {
    const { user, formatCurrency, t, API_BASE_URL, getAuthHeaders } = useApp();
    const [pendingCampaigns, setPendingCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, campaign: null, action: null });
    const [adminMessage, setAdminMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPendingCampaigns = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/campaigns/approval/pending`, {
                headers: { ...getAuthHeaders() }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingCampaigns(data);
            } else {
                throw new Error('Failed to fetch pending campaigns');
            }
        } catch (error) {
            console.error('Error fetching pending campaigns:', error);
            toast.error('Failed to load pending campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchPendingCampaigns();
        }
    }, [user]);

    const handleAction = async () => {
        if (!actionModal.campaign || !actionModal.action) return;

        // Validate message for reject/request_changes
        if ((actionModal.action === 'reject' || actionModal.action === 'request_changes') && !adminMessage.trim()) {
            toast.error('Please provide a message explaining the reason');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/campaigns/approval/${actionModal.campaign.id}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    action: actionModal.action,
                    message: adminMessage || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                setActionModal({ open: false, campaign: null, action: null });
                setAdminMessage('');
                fetchPendingCampaigns(); // Refresh list
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Action failed');
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const openActionModal = (campaign, action) => {
        setActionModal({ open: true, campaign, action });
        setAdminMessage('');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredCampaigns = pendingCampaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.advertiser_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.advertiser_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="mx-auto mb-4 text-red-500" size={64} />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400">This page is restricted to administrators only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-primary" size={32} />
                        <span>Campaign</span>
                        <span className="text-primary">Approvals</span>
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Review and approve advertiser campaign submissions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={fetchPendingCampaigns}
                        className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                            <p className="text-2xl font-black text-white">{pendingCampaigns.length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review SLA</p>
                            <p className="text-2xl font-black text-white">24h</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Queue</p>
                            <p className="text-2xl font-black text-white">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-[#0A0F1D]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/[0.05] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center">
                        <RefreshCw className="mx-auto mb-4 text-primary animate-spin" size={48} />
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] italic opacity-60">Decrypting Queue...</p>
                    </div>
                ) : pendingCampaigns.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <CheckCircle2 className="text-emerald-500" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Zero Latency</h3>
                        <p className="text-slate-500 font-bold">No initiatives awaiting validation.</p>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-800/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Search className="text-slate-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Null Result</h3>
                        <p className="text-slate-500 font-bold mb-6">Specified criteria returned no matching campaigns.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-primary font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Reset Search Matrix
                        </button>
                    </div>
                ) : (
                    <div className="w-full"> {/* Removed overflow-x-auto to comply with user request and instead fit design */}
                        <table className="w-full text-left table-fixed">
                            <thead>
                                <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                                    <th className="w-[30%] px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Identity & Source</th>
                                    <th className="w-[25%] px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Specifications</th>
                                    <th className="w-[15%] px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Investment</th>
                                    <th className="w-[12%] px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">State</th>
                                    <th className="w-[18%] px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center italic">Verdict</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {filteredCampaigns.map((campaign) => (
                                    <React.Fragment key={campaign.id}>
                                        <tr
                                            className={`hover:bg-white/[0.02] transition-all duration-300 group cursor-pointer ${expandedRow === campaign.id ? 'bg-primary/[0.03]' : ''}`}
                                            onClick={() => setExpandedRow(expandedRow === campaign.id ? null : campaign.id)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.05] flex items-center justify-center text-primary font-black italic shadow-inner group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shrink-0">
                                                        {campaign.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-100 italic tracking-tight group-hover:text-primary transition-colors truncate">{campaign.name.toUpperCase()}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-500 font-bold truncate">By {campaign.advertiser_name}</span>
                                                            <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                                            <span className="text-[9px] text-slate-600 font-black">#{campaign.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold italic">
                                                        <Building2 size={12} className="text-primary/60 shrink-0" />
                                                        <span className="truncate">{campaign.industry_type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-black uppercase tracking-widest leading-none">
                                                        <Globe size={10} className="shrink-0" />
                                                        <span className="truncate">{campaign.coverage_area || campaign.coverage_type}</span>
                                                        <span className="mx-1 opacity-30">|</span>
                                                        <span className="truncate">{campaign.ad_format || 'DISPLAY'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black text-white italic tracking-tighter">{formatCurrency(campaign.calculated_price || 0)}</p>
                                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">{formatDate(campaign.submitted_at)}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={campaign.status} />
                                            </td>
                                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openActionModal(campaign, 'approve')}
                                                        className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 group/btn"
                                                        title="Approve Submission"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal(campaign, 'reject')}
                                                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                        title="Terminate Submission"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setExpandedRow(expandedRow === campaign.id ? null : campaign.id)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${expandedRow === campaign.id
                                                            ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                                                        title="Exploded View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === campaign.id && (
                                            <tr className="bg-primary/[0.01]">
                                                <td colSpan={5} className="px-10 py-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Structural Intel</h4>
                                                            <div className="space-y-3 bg-black/20 p-5 rounded-3xl border border-white/5">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Region Matrix:</span>
                                                                    <span className="text-sm font-black text-white italic">{campaign.target_country || 'Global Node'}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Coverage Type:</span>
                                                                    <span className="text-xs font-black text-slate-300 uppercase italic tracking-widest">{campaign.coverage_type}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Format Index:</span>
                                                                    <span className="text-xs font-black text-slate-300 italic">{campaign.ad_format || 'Standard Display'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Origin Details</h4>
                                                            <div className="space-y-3 bg-black/20 p-5 rounded-3xl border border-white/5">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Source Operator:</span>
                                                                    <span className="text-sm font-black text-white italic truncate ml-4">{campaign.advertiser_name}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Secure Email:</span>
                                                                    <span className="text-xs font-bold text-slate-400 truncate ml-4">{campaign.advertiser_email}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Industry Sect.:</span>
                                                                    <span className="text-xs font-black text-amber-500 italic uppercase">{campaign.industry_type}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Financial Protocol</h4>
                                                            <div className="space-y-3 bg-black/20 p-5 rounded-3xl border border-white/5">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase">Monthly Yield:</span>
                                                                    <span className="text-lg font-black text-emerald-400 italic tracking-tighter">{formatCurrency(campaign.calculated_price || 0)}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => openActionModal(campaign, 'request_changes')}
                                                                    className="w-full py-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] font-black text-orange-400 uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all italic mt-2"
                                                                >
                                                                    Request Specification Adjust
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal.open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            {actionModal.action === 'approve' && (
                                <div className="p-3 rounded-xl bg-emerald-500/10">
                                    <CheckCircle2 className="text-emerald-400" size={28} />
                                </div>
                            )}
                            {actionModal.action === 'reject' && (
                                <div className="p-3 rounded-xl bg-red-500/10">
                                    <XCircle className="text-red-400" size={28} />
                                </div>
                            )}
                            {actionModal.action === 'request_changes' && (
                                <div className="p-3 rounded-xl bg-orange-500/10">
                                    <MessageSquare className="text-orange-400" size={28} />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-white capitalize">
                                    {actionModal.action === 'approve' ? 'Approve' : actionModal.action === 'request_changes' ? 'Request Changes' : actionModal.action} Campaign
                                </h3>
                                <p className="text-sm text-slate-400">"{actionModal.campaign?.name}"</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                {actionModal.action === 'approve' ? 'Message (Optional)' : 'Reason (Required)'}
                            </label>
                            <textarea
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                                placeholder={
                                    actionModal.action === 'approve'
                                        ? 'Optional message for the advertiser...'
                                        : 'Provide feedback for the advertiser...'
                                }
                                rows={4}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ open: false, campaign: null, action: null })}
                                className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={processing}
                                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors ${actionModal.action === 'approve'
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : actionModal.action === 'reject'
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                    } disabled:opacity-50`}
                            >
                                {processing ? (
                                    <RefreshCw className="inline-block animate-spin mr-2" size={16} />
                                ) : null}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCampaigns;
