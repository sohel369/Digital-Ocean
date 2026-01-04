import React, { useState } from 'react';

/**
 * SubscriptionSelector Component
 * 
 * A reusable segmented control/radio card selector for subscription duration.
 * Includes visual highlights for discounts and enterprise-grade styling.
 * 
 * Props:
 * - selectedDuration: number (3, 6, or 12)
 * - onChange: function(duration)
 */
export const SubscriptionSelector = ({ selectedDuration, onChange }) => {
  const options = [
    { 
      value: 3, 
      label: '3 Months', 
      subtext: 'Standard', 
      discount: null 
    },
    { 
      value: 6, 
      label: '6 Months', 
      subtext: '15% Savings', 
      discount: 15,
      popular: true
    },
    { 
      value: 12, 
      label: '12 Months', 
      subtext: '25% Best Value', 
      discount: 25 
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => {
          const isSelected = selectedDuration === option.value;
          
          return (
            <div
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                relative cursor-pointer rounded-xl border p-4 transition-all duration-200
                flex flex-col items-center justify-center text-center gap-2
                hover:shadow-lg
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/10' 
                  : 'border-white/10 bg-slate-900/40 hover:bg-slate-800/60 hover:border-white/20'
                }
              `}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(option.value);
                }
              }}
            >
              {/* Active Indicator Ring (Optional extra polish) */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-indigo-500/50 pointer-events-none" />
              )}

              {/* Discount/Popular Badge */}
              {option.discount && (
                <div className={`
                  px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                  ${isSelected ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white/10 text-indigo-300'}
                `}>
                  {option.discount}% OFF
                </div>
              )}
              
              {/* Label */}
              <div className="text-lg font-bold text-slate-100">
                {option.label}
              </div>

              {/* Subtext */}
              <div className={`text-sm ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {option.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper Note */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="opacity-70"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <span>Discounts are configurable by administrators</span>
      </div>
    </div>
  );
};

/**
 * Mock Pricing Page Component
 * Demonstrates usage of SubscriptionSelector with dynamic summary updates.
 */
export default function PricingPageMock() {
  const [radius, setRadius] = useState(30);
  const [duration, setDuration] = useState(6); // Default to 6 months
  
  // Constants
  const BASE_FEE = 200;
  const COST_PER_5_MILES = 50;

  // Logic
  const radiusCost = Math.floor(radius / 5) * COST_PER_5_MILES;
  const subtotal = BASE_FEE + radiusCost;

  let discountPercent = 0;
  if (duration === 6) discountPercent = 15;
  if (duration === 12) discountPercent = 25;

  const discountAmount = Math.floor(subtotal * (discountPercent / 100));
  const totalMonthly = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Pricing Calculator
          </h1>
          <p className="text-slate-400 mt-2">React Component Demo</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration Panel */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-8 pb-4 border-b border-white/5">Campaign Configuration</h2>
            
            <div className="space-y-8">
              {/* Radius Slider (Mock) */}
              <div>
                <div className="flex justify-between mb-4">
                  <label className="text-slate-300 font-medium">Target Radius</label>
                  <span className="text-indigo-400 font-bold">{radius} miles</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={radius} 
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>5 mi</span>
                  <span>50 mi</span>
                </div>
              </div>

              {/* NEW Subscription Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-4">Subscription Duration</label>
                <SubscriptionSelector 
                  selectedDuration={duration} 
                  onChange={setDuration} 
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown Panel */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden">
            {/* Gradient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
            
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-white/5 relative z-10">Cost Breakdown</h2>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-slate-400">
                <span>Base Platform Fee</span>
                <span>${BASE_FEE}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Radius Cost ({radius} miles)</span>
                <span>${radiusCost}</span>
              </div>
              
              <div className="pt-4 mt-2 border-t border-white/5 flex justify-between font-semibold text-slate-200">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>

              {/* Dynamic Discount Row */}
              <div className={`flex justify-between transition-colors duration-300 ${discountAmount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span>Duration Discount ({discountPercent}%)</span>
                <span>-${discountAmount}</span>
              </div>

              {/* Total */}
              <div className="pt-6 mt-2 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 font-medium">Monthly Total</span>
                  <span className="text-4xl font-bold text-indigo-400">${totalMonthly}</span>
                </div>
                <p className="text-right text-xs text-slate-500 mt-2">Billed every {duration} months</p>
              </div>

              <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                Subscribe & Launch Algorithm
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
