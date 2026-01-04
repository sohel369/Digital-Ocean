import React, { useState } from 'react';
import { SubscriptionSelector } from '../components/SubscriptionSelector';
import { PaymentModal } from '../components/PaymentCheckout';

const Pricing = () => {
    const [radius, setRadius] = useState(30);
    const [duration, setDuration] = useState(6); // Default to 6 months
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
    const totalDueNow = totalMonthly * duration;

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                        Campaign Pricing
                    </h1>
                    <p className="text-slate-400 mt-2">Transparent, radius-based pricing tailored to your reach.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Configuration Panel */}
                    <div className="glass-panel rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-xl font-bold mb-8 pb-4 border-b border-white/5 text-slate-100">Campaign Configuration</h2>

                        <div className="space-y-8">
                            {/* Radius Slider */}
                            <div>
                                <div className="flex justify-between mb-4">
                                    <label className="text-slate-300 font-medium">Target Radius</label>
                                    <span className="text-primary-light font-bold">{radius} miles</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={radius}
                                    onChange={(e) => setRadius(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-light"
                                />
                                <div className="flex justify-between mt-2 text-xs text-slate-500">
                                    <span>5 mi</span>
                                    <span>50 mi</span>
                                </div>

                                {/* Visual Radius Indicator (Simple CSS Circle) */}
                                <div className="mt-6 flex justify-center items-center h-32 relative border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full z-10"></div>
                                        <div
                                            className="border border-indigo-500/30 bg-indigo-500/10 rounded-full transition-all duration-300"
                                            style={{ width: `${(radius / 50) * 100}%`, height: `${(radius / 50) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="absolute bottom-2 right-2 text-[10px] text-slate-600">Coverage Map Preview</span>
                                </div>
                            </div>

                            {/* Subscription Selector */}
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
                    <div className="glass-panel border-primary/20 rounded-2xl p-8 relative overflow-hidden">
                        {/* Gradient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

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
                                <span>Subtotal (Monthly)</span>
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
                                    <span className="text-4xl font-bold text-primary-light">${totalMonthly}</span>
                                </div>
                                <div className="flex justify-between items-baseline mt-2 text-sm text-slate-500">
                                    <span>Total Due ({duration} months)</span>
                                    <span>${totalDueNow}</span>
                                </div>
                                <p className="text-right text-xs text-slate-600 mt-2">All prices in USD. Tax calculated at checkout.</p>
                            </div>

                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                className="w-full mt-8 premium-btn text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                amount={totalDueNow}
            />
        </div>
    );
};

export default Pricing;
