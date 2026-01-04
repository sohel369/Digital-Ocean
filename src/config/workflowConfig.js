/**
 * Approval Workflow Configuration
 * Campaign Status Flow: Draft → Submitted → In Review → Approved / Rejected
 */

export const CAMPAIGN_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    IN_REVIEW: 'in_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
};

export const STATUS_CONFIG = {
    [CAMPAIGN_STATUS.DRAFT]: {
        label: 'Draft',
        color: 'slate',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/20',
        icon: '📝',
        description: 'Campaign is being created',
        nextStates: ['submitted'],
    },
    [CAMPAIGN_STATUS.SUBMITTED]: {
        label: 'Submitted',
        color: 'blue',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
        icon: '📤',
        description: 'Waiting for review',
        nextStates: ['in_review'],
    },
    [CAMPAIGN_STATUS.IN_REVIEW]: {
        label: 'In Review',
        color: 'amber',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
        icon: '🔍',
        description: 'Under review by admin',
        nextStates: ['approved', 'rejected'],
    },
    [CAMPAIGN_STATUS.APPROVED]: {
        label: 'Approved',
        color: 'emerald',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/20',
        icon: '✅',
        description: 'Campaign approved, ready to activate',
        nextStates: ['active'],
    },
    [CAMPAIGN_STATUS.REJECTED]: {
        label: 'Rejected',
        color: 'red',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/20',
        icon: '❌',
        description: 'Campaign rejected, needs revision',
        nextStates: ['draft'],
    },
    [CAMPAIGN_STATUS.ACTIVE]: {
        label: 'Active',
        color: 'green',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/20',
        icon: '🟢',
        description: 'Campaign is live',
        nextStates: ['paused', 'completed'],
    },
    [CAMPAIGN_STATUS.PAUSED]: {
        label: 'Paused',
        color: 'orange',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/20',
        icon: '⏸️',
        description: 'Campaign temporarily paused',
        nextStates: ['active', 'completed'],
    },
    [CAMPAIGN_STATUS.COMPLETED]: {
        label: 'Completed',
        color: 'purple',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/20',
        icon: '🏁',
        description: 'Campaign finished',
        nextStates: [],
    },
};

export const NOTIFICATION_TYPES = {
    CAMPAIGN_SUBMITTED: 'campaign_submitted',
    CAMPAIGN_APPROVED: 'campaign_approved',
    CAMPAIGN_REJECTED: 'campaign_rejected',
    CAMPAIGN_ACTIVATED: 'campaign_activated',
    BUDGET_WARNING: 'budget_warning',
    BUDGET_DEPLETED: 'budget_depleted',
    PERFORMANCE_ALERT: 'performance_alert',
    SYSTEM_UPDATE: 'system_update',
};

export const NOTIFICATION_CONFIG = {
    [NOTIFICATION_TYPES.CAMPAIGN_SUBMITTED]: {
        title: 'Campaign Submitted',
        icon: '📤',
        color: 'blue',
        priority: 'medium',
    },
    [NOTIFICATION_TYPES.CAMPAIGN_APPROVED]: {
        title: 'Campaign Approved',
        icon: '✅',
        color: 'green',
        priority: 'high',
    },
    [NOTIFICATION_TYPES.CAMPAIGN_REJECTED]: {
        title: 'Campaign Rejected',
        icon: '❌',
        color: 'red',
        priority: 'high',
    },
    [NOTIFICATION_TYPES.CAMPAIGN_ACTIVATED]: {
        title: 'Campaign Activated',
        icon: '🚀',
        color: 'emerald',
        priority: 'high',
    },
    [NOTIFICATION_TYPES.BUDGET_WARNING]: {
        title: 'Budget Warning',
        icon: '⚠️',
        color: 'amber',
        priority: 'high',
    },
    [NOTIFICATION_TYPES.BUDGET_DEPLETED]: {
        title: 'Budget Depleted',
        icon: '🚨',
        color: 'red',
        priority: 'critical',
    },
    [NOTIFICATION_TYPES.PERFORMANCE_ALERT]: {
        title: 'Performance Alert',
        icon: '📊',
        color: 'orange',
        priority: 'medium',
    },
    [NOTIFICATION_TYPES.SYSTEM_UPDATE]: {
        title: 'System Update',
        icon: 'ℹ️',
        color: 'slate',
        priority: 'low',
    },
};

/**
 * Check if status transition is valid
 */
export const canTransitionTo = (currentStatus, targetStatus) => {
    const config = STATUS_CONFIG[currentStatus];
    return config && config.nextStates.includes(targetStatus);
};

/**
 * Get status badge configuration
 */
export const getStatusBadge = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[CAMPAIGN_STATUS.DRAFT];
};
