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
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 w-full justify-between
          ${isOpen
                        ? 'bg-primary/20 border-primary/50 text-primary-light'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }
        `}
            >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {icon}
                    <span className="text-xs font-semibold truncate whitespace-nowrap">{options.find(o => o.code === value || o.value === value)?.name || options.find(o => o.code === value)?.code || value}</span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${align === 'top' ? 'bottom-full mb-2' : 'mt-2'} ${menuWidth} bg-[#1e293b] border border-slate-700 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[300px] overflow-y-auto`}>
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.code || option.value}
                                onClick={() => {
                                    onChange(option.code || option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors flex justify-between items-center
                  ${(option.code || option.value) === value
                                        ? 'bg-primary/20 text-primary-light font-medium'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }
                `}
                            >
                                <span className="truncate">{option.name || option.label}</span>
                                {option.symbol && <span className="text-xs text-slate-400 font-mono ml-2">{option.symbol}</span>}
                                {option.currency && <span className="text-xs text-slate-400 font-mono ml-2">{option.currency}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
