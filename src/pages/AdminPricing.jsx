import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, RefreshCcw, TrendingUp, Map, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const AdminPricing = () => {
    const { pricingData } = useApp();
    const [localPricing, setLocalPricing] = useState(pricingData);

    const handleMultiplierChange = (industryName, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            industries: prev.industries.map(ind =>
                ind.name === industryName ? { ...ind, multiplier: parseFloat(newValue) } : ind
            )
        }));
    };

    const handleBaseRateChange = (adTypeName, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            adTypes: prev.adTypes.map(ad =>
                ad.name === adTypeName ? { ...ad, baseRate: parseFloat(newValue) } : ad
            )
        }));
    };

    const handleSave = () => {
        // In a real app, this would be an API call
        toast.success("Pricing configurations updated successfully!");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">Admin <span className="text-primary">Pricing Control</span></h1>
                    <p className="text-slate-400 text-sm font-medium">Global configuration for industry multipliers and base rates.</p>
                </div>
                <button onClick={handleSave} className="w-full sm:w-auto premium-btn px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2">
                    <Save size={20} /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Industry Multipliers */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Briefcase className="text-primary" size={24} />
                        <h2 className="text-xl font-bold text-white">Industry Multipliers</h2>
                    </div>

                    <div className="space-y-4">
                        {localPricing.industries.map((ind) => (
                            <div key={ind.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3">
                                <span className="text-slate-200 font-bold text-sm sm:text-base">{ind.name}</span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full sm:w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-primary-light font-black outline-none focus:ring-2 focus:ring-primary/50 text-right sm:text-left"
                                        value={ind.multiplier}
                                        onChange={(e) => handleMultiplierChange(ind.name, e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Multi</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ad Type Base Rates */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <TrendingUp className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-bold text-white">Base Rates (per 30mi)</h2>
                    </div>

                    <div className="space-y-4">
                        {localPricing.adTypes.map((ad) => (
                            <div key={ad.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3">
                                <span className="text-slate-200 font-bold text-sm sm:text-base">{ad.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full sm:w-auto">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                        <input
                                            type="number"
                                            className="w-full sm:w-28 bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-3 py-2 text-emerald-400 font-black outline-none focus:ring-2 focus:ring-emerald-500/50 text-right sm:text-left"
                                            value={ad.baseRate}
                                            onChange={(e) => handleBaseRateChange(ad.name, e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Rate</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geographic Factors Preview */}
            <div className="glass-panel rounded-[2rem] p-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                    <Map className="text-blue-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Geographic Weightings (Multi-State)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {localPricing.states.slice(0, 8).map(state => (
                        <div key={state.name} className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 group hover:border-primary/30 transition-colors">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">{state.name}</p>
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-black text-white italic">{state.densityMultiplier}x</span>
                                <span className="text-[10px] text-slate-600 font-bold">Density Multi</span>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 font-bold text-sm cursor-pointer hover:text-slate-400 hover:border-slate-700">
                        + Add Region
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPricing;
