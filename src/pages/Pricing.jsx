import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Globe, Layout, Building2, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { PaymentModal } from '../components/PaymentCheckout';

const Pricing = () => {
    const { pricingData } = useApp();
    const [selectedIndustry, setSelectedIndustry] = useState(pricingData.industries[0]);
    const [selectedAdType, setSelectedAdType] = useState(pricingData.adTypes[0]);
    const [coverageArea, setCoverageArea] = useState('radius'); // 'radius', 'state', 'national'
    const [selectedState, setSelectedState] = useState(pricingData.states[0]);
    const [postcode, setPostcode] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Pricing Logic Constants
    const RADIUS_AREA = 2827; // sq miles for 30 mile radius

    const calculation = useMemo(() => {
        let sections = 1;
        let discount = 0;
        let areaDescription = "30 Mile Radius around postcode";

        if (coverageArea === 'state') {
            const rawSections = selectedState.landMass / RADIUS_AREA;
            sections = rawSections * selectedState.densityMultiplier;
            discount = pricingData.discounts.state;
            areaDescription = `Full coverage of ${selectedState.name}`;
        } else if (coverageArea === 'national') {
            // Aggregate all states for national
            const totalSections = pricingData.states.reduce((acc, s) => acc + (s.landMass / RADIUS_AREA * s.densityMultiplier), 0);
            sections = totalSections;
            discount = pricingData.discounts.national;
            areaDescription = "Nationwide coverage (All States)";
        }

        const basePrice = sections * selectedAdType.baseRate * selectedIndustry.multiplier;
        const discountAmount = basePrice * discount;
        const finalPrice = basePrice - discountAmount;

        return {
            basePrice: Math.round(basePrice),
            discountAmount: Math.round(discountAmount),
            finalPrice: Math.round(finalPrice),
            sections: sections.toFixed(2),
            discountPercent: (discount * 100).toFixed(0),
            areaDescription
        };
    }, [coverageArea, selectedState, selectedAdType, selectedIndustry, pricingData]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
                    Dynamic <span className="text-primary">Campaign Pricing</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-lg">
                    Rule 7 Media's algorithm calculates fair pricing based on land mass, population density,
                    and industry value. Choose your reach below.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6 md:space-y-8">

                    {/* Step 1: Industry & Ad Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="glass-panel p-5 md:p-6 rounded-3xl">
                            <label className="flex items-center gap-2 text-slate-100 font-bold mb-4 text-sm md:text-base">
                                <Building2 size={18} className="text-primary" />
                                1. Select Industry
                            </label>
                            <select
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 md:py-4 text-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                                value={selectedIndustry.name}
                                onChange={(e) => setSelectedIndustry(pricingData.industries.find(i => i.name === e.target.value))}
                            >
                                {pricingData.industries.map(i => (
                                    <option key={i.name} value={i.name}>{i.name} (x{i.multiplier})</option>
                                ))}
                            </select>
                        </div>

                        <div className="glass-panel p-5 md:p-6 rounded-3xl">
                            <label className="flex items-center gap-2 text-slate-100 font-bold mb-4 text-sm md:text-base">
                                <Layout size={18} className="text-primary" />
                                2. Advert Format
                            </label>
                            <select
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 md:py-4 text-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                                value={selectedAdType.name}
                                onChange={(e) => setSelectedAdType(pricingData.adTypes.find(a => a.name === e.target.value))}
                            >
                                {pricingData.adTypes.map(a => (
                                    <option key={a.name} value={a.name}>{a.name} - ${a.baseRate} base</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Step 2: Coverage Area */}
                    <div className="glass-panel p-6 md:p-8 rounded-3xl">
                        <label className="flex items-center gap-2 text-slate-100 font-bold mb-6 text-lg md:text-xl">
                            <MapPin size={22} className="text-primary" />
                            3. Select Coverage Area
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
                            {[
                                { id: 'radius', label: '30 Mile Radius', icon: MapPin, desc: 'Local targeting' },
                                { id: 'state', label: 'State Wide', icon: Layout, desc: 'Full state reach' },
                                { id: 'national', label: 'Country Wide', icon: Globe, desc: 'Maximum exposure' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setCoverageArea(option.id)}
                                    className={`relative p-4 md:p-5 rounded-2xl text-left transition-all border-2 flex flex-col gap-1 md:gap-2 ${coverageArea === option.id
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    {coverageArea === option.id && <CheckCircle2 size={18} className="absolute top-3 md:top-4 right-3 md:right-4 text-primary" />}
                                    <option.icon size={24} className={coverageArea === option.id ? 'text-primary' : 'text-slate-500'} />
                                    <span className="font-bold text-slate-100 text-sm md:text-base">{option.label}</span>
                                    <span className="text-[10px] md:text-xs text-slate-500">{option.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Inputs Based on Selection */}
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            {coverageArea === 'radius' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Postcode</label>
                                    <input
                                        type="text"
                                        className="w-full sm:w-64 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="e.g. 90210"
                                        value={postcode}
                                        onChange={(e) => setPostcode(e.target.value)}
                                    />
                                    <p className="text-[10px] md:text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                                        <Info size={12} /> Pricing is calculated for a 30-mile radius (approx. 2,827 sq mi)
                                    </p>
                                </div>
                            )}

                            {coverageArea === 'state' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select State</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                        {pricingData.states.map(state => (
                                            <button
                                                key={state.name}
                                                onClick={() => setSelectedState(state)}
                                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedState.name === state.name
                                                    ? 'bg-white text-slate-950 border-white'
                                                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                                                    }`}
                                            >
                                                {state.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {coverageArea === 'national' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 md:p-6 flex gap-3 md:gap-4 items-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                                        <Globe size={20} md:size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-400 text-sm md:text-base">Nationwide Optimal Pricing</h4>
                                        <p className="text-[10px] md:text-sm text-slate-400 font-medium leading-relaxed">
                                            A 30% discount is automatically applied for campaigns spanning all states.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing Summary Side Card */}
                <div className="lg:col-span-12 xl:col-span-4">
                    <div className="glass-panel p-6 md:p-8 rounded-3xl sticky top-24 overflow-hidden group">
                        {/* Glow Gradient */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none group-hover:bg-primary/30 transition-all duration-500" />

                        <h3 className="text-lg md:text-xl font-bold mb-6 text-slate-100 flex items-center justify-between">
                            Order Summary
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rule 7 Ops</span>
                        </h3>

                        <div className="space-y-6 relative z-10">
                            {/* Summary Rows */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">Format</p>
                                        <p className="text-slate-200 font-bold text-sm">{selectedAdType.name}</p>
                                    </div>
                                    <span className="text-slate-200 font-black">${selectedAdType.baseRate}</span>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">Reach</p>
                                        <p className="text-slate-200 font-bold text-sm line-clamp-1">{calculation.areaDescription}</p>
                                    </div>
                                    <span className="text-slate-200 font-black">x{calculation.sections}</span>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">Industry</p>
                                        <p className="text-slate-200 font-bold text-sm">{selectedIndustry.name}</p>
                                    </div>
                                    <span className="text-slate-200 font-black">x{selectedIndustry.multiplier}</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800" />

                            {/* Totals */}
                            <div className="space-y-3 font-bold">
                                <div className="flex justify-between text-slate-200 text-sm">
                                    <span className="text-slate-400">Base Calculation</span>
                                    <span>${calculation.basePrice.toLocaleString()}</span>
                                </div>
                                {calculation.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-400 text-sm italic">
                                        <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                                            Bulk Discount ({calculation.discountPercent}%)
                                        </span>
                                        <span>-${calculation.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 md:pt-6 relative group/price">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover/price:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex flex-col sm:flex-row justify-between items-baseline gap-1 mb-2">
                                        <span className="text-slate-100 font-bold text-base md:text-lg">Total Monthly</span>
                                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter shadow-sm">
                                            ${calculation.finalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-right text-[10px] text-slate-500 font-bold uppercase tracking-tight">Dynamic Rate Applied</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                className="w-full premium-btn py-4 md:py-5 rounded-2xl text-base md:text-lg group/btn"
                            >
                                Confirm & Pay
                                <ChevronRight size={18} md:size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            <div className="flex items-center justify-center gap-3 pt-2 grayscale opacity-30">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
                                <div className="w-px h-3 bg-slate-700" />
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Secure Payment</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Payment Modal */}
            <PaymentModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                amount={calculation.finalPrice}
            />
        </div>
    );
};

export default Pricing;

