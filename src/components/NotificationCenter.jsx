import React, { useState, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { NOTIFICATION_CONFIG } from '../config/workflowConfig';

/**
 * Notification Center Component
 * Real-time notification system with action center
 */

const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CheckAllIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
);

const NotificationItem = ({ notification, onRead, onClear }) => {
    const config = NOTIFICATION_CONFIG[notification.type] || {};
    const timeAgo = getTimeAgo(notification.timestamp);

    return (
        <div
            className={`
        relative p-4 border-b border-slate-700/50 transition-all duration-200
        ${notification.read ? 'bg-slate-900/20' : 'bg-slate-800/40 hover:bg-slate-800/60'}
        group cursor-pointer
      `}
            onClick={() => !notification.read && onRead(notification.id)}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full"></div>
            )}

            <div className="flex items-start gap-3 ml-4">
                {/* Icon */}
                <div className={`text-2xl flex-shrink-0 mt-0.5`}>
                    {config.icon || '📬'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                            {notification.title || config.title}
                        </h4>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                        >
                            <CloseIcon className="text-slate-400 hover:text-white" />
                        </button>
                    </div>

                    <p className={`text-xs mt-1 ${notification.read ? 'text-slate-500' : 'text-slate-400'}`}>
                        {notification.message}
                    </p>

                    {/* Action buttons */}
                    {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {notification.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    className={`
                    px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${action.primary
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }
                  `}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">{timeAgo}</span>
                        {notification.campaignName && (
                            <>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-500">{notification.campaignName}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useGlobal();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-900 px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 p-4 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all"
                                >
                                    <CheckAllIcon />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <div className="text-5xl mb-4">🔔</div>
                                <p className="text-sm font-semibold text-slate-400">No notifications</p>
                                <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={markAsRead}
                                    onClear={clearNotification}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function
const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
};

export default NotificationCenter;
