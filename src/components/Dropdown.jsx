import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Dropdown = ({ label, icon, options, value, onChange, align = 'right', className = '', menuWidth = 'w-48' }) => {
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
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm transition-all duration-300 w-full justify-between outline-none
          ${isOpen
                        ? 'bg-primary/10 border-primary/40 text-primary-light shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'bg-[#111622] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#151b2b]'
                    }
        `}
            >
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    {icon && <span className="shrink-0">{icon}</span>}
                    <span className="text-sm font-bold truncate whitespace-nowrap tracking-tight">
                        {options.find(o => o.code === value || o.value === value)?.name ||
                            options.find(o => o.code === value || o.value === value)?.label ||
                            value || label || 'Select Option'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-500'}`} />
            </button>

            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${align === 'top' ? 'bottom-full mb-3' : 'mt-3'} ${menuWidth} bg-[#0f172a] border border-slate-800/80 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl max-h-[350px] overflow-y-auto custom-scrollbar`}>
                    <div className="p-2">
                        {options.map((option) => (
                            <button
                                key={option.code || option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.code || option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full text-left px-4 py-3.5 text-sm transition-all duration-200 flex justify-between items-center rounded-xl mb-1 last:mb-0
                  ${(option.code || option.value) === value
                                        ? 'bg-primary/20 text-primary-light font-bold'
                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white font-bold'
                                    }
                `}
                            >
                                <span className="truncate tracking-tight">{option.name || option.label}</span>
                                <div className="flex items-center gap-2">
                                    {option.symbol && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{option.symbol}</span>}
                                    {option.currency && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{option.currency}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
