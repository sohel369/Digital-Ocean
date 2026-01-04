import React, { useState, useEffect, useRef } from 'react';

// Icons using SVG for no dependencies
const GlobeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const PlusIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

/**
 * Dropdown Menu Component
 */
const Dropdown = ({ label, icon, options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
          ${isOpen
                        ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }
        `}
            >
                {icon}
                <span>{options.find(o => o.value === value)?.label || label}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${value === option.value
                                        ? 'bg-indigo-500/10 text-indigo-400'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }
                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option.label}</span>
                                    {option.symbol && <span className="text-xs opacity-50">{option.symbol}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * I18nHeader Component
 * 
 * Replaces the standard dashboard header with one that supports:
 * - Country context
 * - Currency switching
 * - Language selection
 * - Premium design
 */
export const I18nHeader = () => {
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('EN');

    // Mock data for dropdowns
    const currencies = [
        { value: 'USD', label: 'USD', symbol: '$' },
        { value: 'GBP', label: 'GBP', symbol: '£' },
        { value: 'EUR', label: 'EUR', symbol: '€' },
    ];

    const languages = [
        { value: 'EN', label: 'English' },
        { value: 'FR', label: 'Français' },
        { value: 'DE', label: 'Deutsch' },
        { value: 'ES', label: 'Español' },
    ];

    const currentSymbol = currencies.find(c => c.value === currency)?.symbol || '$';

    return (
        <header className="relative z-40 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 shadow-sm px-8 py-4 mb-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left: Title & Context */}
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Dashboard
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Live
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <GlobeIcon className="w-3 h-3" />
                            United States
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions & I18n Controls */}
            <div className="flex items-center gap-3">

                {/* I18n Group */}
                <div className="flex items-center gap-2 mr-4 pr-4 border-r border-white/5">
                    <Dropdown
                        label="Currency"
                        options={currencies}
                        value={currency}
                        onChange={setCurrency}
                        icon={<span className="font-mono text-xs font-bold text-slate-500">{currentSymbol}</span>}
                    />
                    <Dropdown
                        label="Language"
                        options={languages}
                        value={language}
                        onChange={setLanguage}
                        icon={<span className="text-xs font-bold text-slate-500">{language}</span>}
                    />
                </div>

                {/* Action Group */}
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative">
                        <BellIcon />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></span>
                    </button>

                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        <PlusIcon />
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Optional: Backdrop blur effect overlay for nice glass feel */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </header>
    );
};

export default I18nHeader;
