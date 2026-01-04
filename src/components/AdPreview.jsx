import React, { useState } from 'react';

// Icons
const MonitorIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

const SmartphoneIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
);

const MailIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

/**
 * AdPreview Component
 * 
 * Renders a live preview of the ad content in multiple formats (Desktop, Mobile, Email).
 * 
 * Props:
 * - headline: string
 * - description: string
 * - ctaText: string
 * - image: string (URL)
 */
export const AdPreview = ({
    headline = 'Summer Collection 2024',
    description = 'Discover the latest trends in our new summer collection. Limited time offer on all swimsuits and accessories.',
    ctaText = 'Shop Now',
    image = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    format = ''
}) => {
    const [activeTab, setActiveTab] = useState('desktop');

    // Tab Definitions
    const tabs = [
        { id: 'desktop', label: 'Desktop', icon: <MonitorIcon className="w-4 h-4" /> },
        { id: 'mobile', label: 'Mobile', icon: <SmartphoneIcon className="w-4 h-4" /> },
        { id: 'email', label: 'Email Newsletter', icon: <MailIcon className="w-4 h-4" /> }
    ];

    return (
        <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[600px]">

            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
                <h3 className="font-semibold text-slate-200">Ad Preview</h3>

                <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-sm shadow-blue-900/20'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                                }
              `}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 bg-slate-950 relative overflow-y-auto overflow-x-hidden flex flex-col items-center py-8">

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Content Container */}
                <div className={`
          relative bg-white text-slate-900 shadow-2xl transition-all duration-500 ease-in-out origin-top border border-slate-200 overflow-hidden
          ${format === 'Mobile Banner' ? 'w-[320px] h-[50px] rounded-none' : ''}
          ${format === 'Medium Rectangle' || format === 'Rectangle' ? 'w-[300px] h-[250px] rounded-sm' : ''}
          ${format === 'Leaderboard' ? 'w-[728px] h-[90px] rounded-none' : ''}
          ${!format && activeTab === 'mobile' ? 'w-[375px] rounded-3xl min-h-[600px]' : ''}
          ${!format && activeTab === 'desktop' ? 'w-[800px] rounded-lg min-h-[400px]' : ''}
          ${activeTab === 'email' ? 'w-[600px] rounded-none min-h-[500px] border-t-4 border-indigo-500' : ''}
        `}>

                    {/* Email Header (Only for Email Tab) */}
                    {activeTab === 'email' && (
                        <div className="p-8 pb-4 text-center border-b border-slate-100 mb-4 bg-slate-50">
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">My Newsletter</div>
                            <div className="text-2xl font-serif text-slate-900">Your Brand Weekly</div>
                        </div>
                    )}

                    {/* Ad Content */}
                    <div className={`
            flex flex-col group
            ${activeTab === 'desktop' ? 'flex-row h-full' : ''}
          `}>

                        {/* Image Area */}
                        <div className={`
              relative overflow-hidden bg-slate-100
              ${activeTab === 'desktop' && !format ? 'w-1/2 min-h-[400px]' : ''}
              ${!format && activeTab !== 'desktop' ? 'w-full h-64' : ''}
              ${format === 'Leaderboard' ? 'w-[120px] h-full' : ''}
              ${format === 'Mobile Banner' ? 'w-[80px] h-full' : ''}
              ${format === 'Medium Rectangle' ? 'h-[140px] w-full' : ''}
            `}>
                            <img
                                src={image}
                                alt="Ad Creative"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Sponsored Banner (Desktop/Mobile Only) */}
                            {activeTab !== 'email' && (
                                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    Sponsored
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className={`
              flex flex-col justify-center p-8
              ${activeTab === 'desktop' && !format ? 'w-1/2 p-12' : ''}
              ${format === 'Leaderboard' ? 'w-3/4 p-2 justify-between flex-row items-center' : ''}
              ${format === 'Mobile Banner' ? 'w-2/3 p-2 justify-center' : ''}
              ${format === 'Medium Rectangle' ? 'p-4' : ''}
            `}>
                            {activeTab !== 'email' && (
                                <div className="text-indigo-600 text-xs font-bold uppercase tracking-wide mb-2">New Arrival</div>
                            )}

                            <h2 className={`
                font-bold text-slate-900 leading-tight
                ${activeTab === 'desktop' && !format ? 'text-3xl mb-3' : 'text-2xl mb-3'}
                ${format === 'Leaderboard' ? 'text-lg mb-0 truncate' : ''}
                ${format === 'Mobile Banner' ? 'text-xs mb-0 line-clamp-1' : ''}
                ${format === 'Medium Rectangle' ? 'text-lg mb-2' : ''}
                ${activeTab === 'email' ? 'font-serif' : ''}
              `}>
                                {headline}
                            </h2>

                            <p className={`
                                text-slate-600 leading-relaxed
                                ${format === 'Mobile Banner' || format === 'Leaderboard' ? 'hidden' : 'mb-6'}
                                ${format === 'Medium Rectangle' ? 'text-xs mb-3 line-clamp-3' : ''}
                            `}>
                                {description}
                            </p>

                            <button className={`
                font-semibold rounded-lg transition-colors
                ${activeTab === 'email'
                                    ? 'bg-indigo-600 text-white w-full shadow-lg rounded-none py-3 px-6'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 self-start'}
                ${!format && activeTab !== 'email' ? 'py-3 px-6' : ''}
                ${format === 'Leaderboard' ? 'py-1.5 px-4 text-xs ml-4' : ''}
                ${format === 'Mobile Banner' ? 'py-1 px-3 text-[10px] ml-2' : ''}
                ${format === 'Medium Rectangle' ? 'py-2 px-4 text-xs w-full mt-auto' : ''}
              `}>
                                {ctaText}
                            </button>

                            {/* Email Footer (Only for Email tab) */}
                            {activeTab === 'email' && (
                                <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                                    <p>You received this email because you subscribed to our list.</p>
                                    <p className="mt-1 underline cursor-pointer">Unsubscribe</p>
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* Footer Helper Text */}
                {activeTab === 'email' && (
                    <div className="absolute bottom-6 bg-slate-800/90 text-slate-400 text-xs px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <MailIcon className="w-3 h-3" />
                        <span className="font-medium">This format is optimised for email newsletter placements</span>
                    </div>
                )}

            </div>

        </div>
    );
};

export default AdPreview;
