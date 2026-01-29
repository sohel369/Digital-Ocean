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
    const containerRef = React.useRef(null);
    const [scale, setScale] = useState(1);

    const {
        headline = '',
        description = '',
        cta = 'Learn More',
        image = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2426&q=80',
        format = ''
    } = formData;

    // Enhanced Realistic Defaults for Preview
    const displayHeadline = headline || "Premium Brand Promotion";
    const displayDescription = description || "Experience world-class service with our industry-leading solutions. Target your local audience effectively today.";
    const displayImage = image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2426&q=80';


    // Helper for visual classes based on format and device
    const getFormatStyles = () => {
        const fmt = (format || '').toLowerCase();

        // 1. Precise Format Matching
        if (fmt.includes('skyscraper')) {
            return { w: 160, h: 600, label: '160 x 600px', layout: 'flex-col', imgH: 'h-1/3', text: 'p-4 text-center' };
        }
        if (fmt.includes('leaderboard') && !fmt.includes('mobile')) {
            return { w: 728, h: 90, label: '728 x 90px', layout: 'flex-row', imgW: 'w-1/4', text: 'p-2 flex-row justify-between items-center' };
        }
        if (fmt.includes('mobile_leaderboard') || (fmt.includes('mobile') && fmt.includes('leaderboard'))) {
            return { w: 320, h: 50, label: '320 x 50px', layout: 'flex-row', imgW: 'w-[80px]', text: 'pl-3 pr-2 flex-row items-center justify-between' };
        }
        if (fmt.includes('medium_rectangle') || fmt.includes('medium rectangle')) {
            return { w: 300, h: 250, label: '300 x 250px', layout: 'flex-col', imgH: 'h-1/2', text: 'p-4' };
        }
        if (fmt.includes('email_newsletter') || fmt.includes('email newsletter')) {
            return { w: 600, h: 200, label: '600 x 200px', layout: 'flex-row', imgW: 'w-1/3', text: 'p-4' };
        }

        // 2. Default Device Views (If no specific format matches)
        if (activeTab === 'mobile') return { w: 320, h: 480, label: 'Mobile Full', layout: 'flex-col', imgH: 'h-[200px]', text: 'p-6' };
        if (activeTab === 'email') return { w: 600, h: 400, label: 'Email Layout', layout: 'flex-col', imgH: 'h-[250px]', text: 'p-8' };
        return { w: 640, h: 360, label: 'Standard View', layout: 'flex-row', imgW: 'w-1/2', text: 'p-8' };
    };

    const styles = getFormatStyles();

    // Auto-scaling logic to fit any format into the preview container
    React.useEffect(() => {
        const calculateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.offsetWidth - 64; // Horizontal padding
            const containerHeight = containerRef.current.offsetHeight - 64; // Vertical padding

            const scaleX = containerWidth / styles.w;
            const scaleY = containerHeight / styles.h;

            // Use the smaller scale but cap at 1 to prevent blurring small ads
            const finalScale = Math.min(scaleX, scaleY, 1);
            setScale(finalScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);

        // Also observe the container itself for size changes
        const observer = new ResizeObserver(calculateScale);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', calculateScale);
            observer.disconnect();
        };
    }, [styles.w, styles.h, activeTab]);

    // Tab Definitions
    const tabs = [
        { id: 'desktop', label: t('campaign.desktop') || 'Desktop', icon: <MonitorIcon className="w-4 h-4" /> },
        { id: 'mobile', label: t('campaign.mobile') || 'Mobile', icon: <SmartphoneIcon className="w-4 h-4" /> },
        { id: 'email', label: t('campaign.email') || 'Email Newsletter', icon: <MailIcon className="w-4 h-4" /> }
    ];

    return (
        <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px] md:min-h-[600px]">

            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-200 text-sm sm:text-base border-l-2 border-primary pl-3 whitespace-nowrap">{t('campaign.live_preview')}</h3>
                    <span className="hidden sm:inline-block px-2 py-1 bg-emerald-500/10 rounded text-[10px] font-black text-emerald-500 border border-emerald-500/30 tracking-widest uppercase italic shadow-[0_0_10px_rgba(16,185,129,0.1)]">{styles.label}</span>
                </div>

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
            <div ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8">

                {/* Dimensions Overlay (Mobile friendly) */}
                <div className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 uppercase tracking-widest z-10 sm:hidden bg-slate-900/50 px-2 py-1 rounded backdrop-blur-sm border border-emerald-500/20">
                    {styles.label}
                </div>

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Content Container with Dynamic Scaling */}
                <div
                    className={`relative bg-white text-slate-900 shadow-2xl transition-all duration-300 ease-out origin-center border border-slate-200 overflow-hidden ${activeTab === 'email' ? 'border-t-4 border-indigo-500 rounded-none' : 'rounded-lg'}`}
                    style={{
                        width: `${styles.w}px`,
                        height: `${styles.h}px`,
                        transform: `scale(${scale})`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >

                    {activeTab === 'email' && styles.h > 100 && (
                        <div className="p-4 pb-2 text-center border-b border-slate-100 bg-slate-50">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{t('preview.newsletter_title')}</div>
                        </div>
                    )}

                    <div className={`flex ${styles.layout} h-full group`}>
                        {/* Image Area */}
                        <div className={`relative overflow-hidden bg-slate-100 ${styles.imgW ? `${styles.imgW}` : 'w-full'} ${styles.imgH ? `${styles.imgH}` : 'h-full'}`}>
                            <img src={displayImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {/* AD Badge Removed per feedback */}
                        </div>

                        {/* Text Area */}
                        <div className={`flex flex-col flex-1 min-w-0 ${styles.text}`}>
                            {styles.h > 80 && (
                                <div className="text-emerald-500 text-[8px] font-bold uppercase tracking-widest mb-1">{t('preview.recommended')}</div>
                            )}
                            <h2 className={`font-bold text-slate-900 leading-tight ${activeTab === 'email' ? 'font-serif' : ''} 
                                ${styles.h <= 50 ? 'text-[10px] mb-0 truncate' : styles.h <= 90 ? 'text-xs mb-0' : 'text-xl mb-2'}`}>
                                {displayHeadline}
                            </h2>
                            <p className={`text-slate-600 text-[11px] leading-snug mb-3 
                                ${styles.h <= 80 ? 'hidden' : 'block line-clamp-2'}`}>
                                {displayDescription}
                            </p>
                            <button className={`font-black uppercase tracking-tighter whitespace-nowrap transition-all 
                                ${activeTab === 'email' ? 'bg-primary text-white' : 'bg-slate-950 text-white hover:bg-slate-800'}
                                ${styles.h <= 50 ? 'py-1 px-2 text-[8px] ml-auto self-center' : styles.h <= 90 ? 'py-1.5 px-3 text-[10px] ml-auto self-center' : 'py-2 px-4 rounded-lg self-start text-xs'}`}>
                                {t(`campaign.${cta}`) || cta}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scale Reset Indicator */}
                {scale < 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Preview scaled to {Math.round(scale * 100)}%
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="mt-8 text-[11px] text-emerald-400 text-center max-w-[600px] px-4 opacity-90 uppercase tracking-widest font-black bg-emerald-500/10 py-4 rounded-2xl border border-emerald-500/20">
                        <p>{t('preview.newsletter_tip')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdPreview;