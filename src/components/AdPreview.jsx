import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

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
 */
export const AdPreview = ({ formData = {} }) => {
    const { t } = useApp();
    const [activeTab, setActiveTab] = useState('desktop');

    const {
        headline = '',
        description = '',
        cta = 'Learn More',
        image = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        format = ''
    } = formData;

    // Tab Definitions
    const tabs = [
        { id: 'desktop', label: t('campaign.desktop') || 'Desktop', icon: <MonitorIcon className="w-4 h-4" /> },
        { id: 'mobile', label: t('campaign.mobile') || 'Mobile', icon: <SmartphoneIcon className="w-4 h-4" /> },
        { id: 'email', label: t('campaign.email') || 'Email Newsletter', icon: <MailIcon className="w-4 h-4" /> }
    ];

    // Helper for visual classes based on format and device
    const getFormatStyles = () => {
        const fmt = (format || '').toLowerCase();

        if (fmt.includes('skyscraper')) {
            return { w: 'w-[160px]', h: 'h-[600px]', layout: 'flex-col', imgH: 'h-1/3', text: 'p-4 text-center' };
        }
        if (fmt.includes('leaderboard') && !fmt.includes('mobile')) {
            return { w: 'w-[728px]', h: 'h-[90px]', layout: 'flex-row', imgW: 'w-1/4', text: 'p-2 flex-row justify-between items-center' };
        }
        if (fmt.includes('mobile leaderboard')) {
            return { w: 'w-[320px]', h: 'h-[50px]', layout: 'flex-row', imgW: 'w-[60px]', text: 'p-1 justify-center' };
        }
        if (fmt.includes('medium rectangle') || fmt.includes('rectangle')) {
            return { w: 'w-[300px]', h: 'h-[250px]', layout: 'flex-col', imgH: 'h-1/2', text: 'p-4' };
        }

        // Defaults based on tab
        if (activeTab === 'mobile') return { w: 'w-[375px]', h: 'min-h-[600px]', layout: 'flex-col', imgH: 'h-[250px]', text: 'p-8' };
        if (activeTab === 'email') return { w: 'w-[600px]', h: 'min-h-[500px]', layout: 'flex-col', imgH: 'h-[300px]', text: 'p-10' };
        return { w: 'w-full max-w-[800px]', h: 'min-h-[400px]', layout: 'flex-row', imgW: 'w-1/2', text: 'p-12' };
    };

    const styles = getFormatStyles();

    return (
        <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px] md:min-h-[600px]">

            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 gap-4 flex-wrap">
                <h3 className="font-bold text-slate-200 text-sm sm:text-base border-l-2 border-primary pl-3 whitespace-nowrap">{t('campaign.live_preview')}</h3>

                <div className="flex p-0.5 sm:p-1 bg-slate-800 rounded-xl border border-slate-700/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 uppercase tracking-tighter sm:tracking-normal
                ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                }
              `}
                        >
                            <span className="shrink-0 scale-90 sm:scale-100">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label.split(' ')[0]}</span>
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
          relative bg-white text-slate-900 shadow-2xl transition-all duration-500 ease-in-out origin-top border border-slate-200 overflow-hidden mx-auto
          ${styles.w} ${styles.h} ${activeTab === 'email' ? 'border-t-4 border-indigo-500 rounded-none' : 'rounded-lg'}
        `} style={{ transform: 'scale(var(--preview-scale, 1))', transformOrigin: 'top center' }}>

                    {activeTab === 'email' && (
                        <div className="p-8 pb-4 text-center border-b border-slate-100 mb-4 bg-slate-50">
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">{t('preview.newsletter_title')}</div>
                            <div className="text-2xl font-serif text-slate-900">{t('preview.newsletter_subtitle')}</div>
                        </div>
                    )}

                    <div className={`flex ${styles.layout} h-full group`}>
                        {/* Image Area */}
                        <div className={`relative overflow-hidden bg-slate-100 ${styles.imgW || 'w-full'} ${styles.imgH || 'h-full'}`}>
                            <img src={image} alt="Ad" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {activeTab !== 'email' && (
                                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-2 py-1 rounded uppercase">
                                    {t('preview.sponsored')}
                                </div>
                            )}
                        </div>

                        {/* Text Area */}
                        <div className={`flex flex-col ${styles.text}`}>
                            {activeTab !== 'email' && (
                                <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">{t('preview.recommended')}</div>
                            )}
                            <h2 className={`font-bold text-slate-900 leading-tight ${activeTab === 'email' ? 'font-serif' : ''} 
                                ${styles.h === 'h-[50px]' ? 'text-xs mb-0 truncate' : styles.h === 'h-[90px]' ? 'text-sm mb-0' : 'text-xl sm:text-2xl mb-2'}`}>
                                {headline || t('campaign.headline_placeholder')}
                            </h2>
                            <p className={`text-slate-600 text-sm leading-relaxed mb-4 
                                ${styles.h === 'h-[50px]' || styles.h === 'h-[90px]' ? 'hidden' : 'block'} 
                                ${styles.h === 'h-[600px]' ? 'line-clamp-6' : 'line-clamp-3'}`}>
                                {description || t('campaign.description_placeholder')}
                            </p>
                            <button className={`font-bold transition-all 
                                ${activeTab === 'email' ? 'bg-indigo-600 text-white py-3 px-6' : 'bg-slate-950 text-white hover:bg-slate-800'}
                                ${styles.h === 'h-[50px]' ? 'py-1.5 px-3 text-[10px] ml-2' : styles.h === 'h-[90px]' ? 'py-1.5 px-4 text-xs ml-4' : 'py-3 px-6 rounded-xl self-start'}`}>
                                {t(`campaign.${cta}`) || cta}
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'email' && (
                    <div className="mt-8 text-xs text-slate-500 text-center max-w-[600px] px-4">
                        <p>{t('preview.newsletter_tip')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdPreview;