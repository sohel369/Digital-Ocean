import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, RefreshCcw, TrendingUp, Map, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const AdminPricing = () => {
    const { pricingData, savePricingConfig, country, setCountry, CONSTANTS, formatCurrency, t, user } = useApp();
    const [localPricing, setLocalPricing] = useState(pricingData);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(country);

    // Sync local state when pricingData is loaded from backend
    React.useEffect(() => {
        if (pricingData.industries.length > 0) {
            setLocalPricing(pricingData);
        }
    }, [pricingData]);

    if (!localPricing.industries || localPricing.industries.length === 0) {
        return <div className="p-8 text-white">{t('common.loading')}</div>;
    }

    const filteredStates = localPricing.states.filter(s => s.countryCode === selectedCountry);

    const handleMultiplierChange = (industryName, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            industries: prev.industries.map(ind =>
                ind.name === industryName ? { ...ind, multiplier: parseFloat(newValue) || 0 } : ind
            )
        }));
    };

    const handleBaseRateChange = (adTypeName, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            adTypes: prev.adTypes.map(ad =>
                ad.name === adTypeName ? { ...ad, baseRate: parseFloat(newValue) || 0 } : ad
            )
        }));
    };

    const handleDiscountChange = (type, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            discounts: { ...prev.discounts, [type]: parseFloat(newValue) || 0 }
        }));
    };

    const handleStateUpdate = (stateName, field, newValue) => {
        setLocalPricing(prev => ({
            ...prev,
            states: prev.states.map(s =>
                s.name === stateName ? { ...s, [field]: field === 'name' ? newValue : parseFloat(newValue) || 0 } : s
            )
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const success = await savePricingConfig(localPricing);
        setIsSaving(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">{t('admin.title')} <span className="text-primary">{t('admin.title_sub')}</span></h1>
                    <p className="text-slate-400 text-sm font-medium">{pricingData.description || 'Global configuration for industry multipliers and base rates.'}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto premium-btn px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 italic"
                >
                    {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? t('admin.saving') : t('admin.save_config')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Industry Multipliers */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <Briefcase className="text-primary" size={24} />
                            <h2 className="text-xl font-bold text-white">{t('admin.industry_multipliers')}</h2>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {localPricing.industries.map((ind) => (
                            <div key={ind.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3">
                                <span className="text-slate-200 font-bold text-sm">
                                    {t(`industry.${ind.name.toLowerCase().replace(/ /g, '_')}`) || ind.name}
                                </span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number" step="0.01"
                                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-primary-light font-black outline-none"
                                        value={ind.multiplier}
                                        onChange={(e) => handleMultiplierChange(ind.name, e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Multi</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ad Type Base Rates */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <TrendingUp className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-bold text-white">{t('admin.base_rates')}</h2>
                    </div>

                    <div className="space-y-4">
                        {localPricing.adTypes.map((ad) => (
                            <div key={ad.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3">
                                <span className="text-slate-200 font-bold text-sm">
                                    {t(`formats.${ad.name.toLowerCase().replace(/ /g, '_')}`) || ad.name}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{CONSTANTS.CURRENCIES.find(c => c.code === (user?.currency || 'USD'))?.symbol || '$'}</span>
                                        <input
                                            type="number"
                                            className="w-28 bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-3 py-2 text-emerald-400 font-black outline-none"
                                            value={ad.baseRate}
                                            onChange={(e) => handleBaseRateChange(ad.name, e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Rate</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geographic Factors */}
            <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <Map className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">{t('admin.geo_weightings')}</h2>
                    </div>

                    <select
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                        {CONSTANTS.COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStates.map(state => (
                        <div key={state.name} className="p-5 bg-slate-900/30 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-start">
                                <h4 className="text-white font-bold">{state.name}</h4>
                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-black">{state.countryCode}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{t('admin.density_multi')}</label>
                                    <input
                                        type="number" step="0.1"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-black text-sm outline-none"
                                        value={state.densityMultiplier}
                                        onChange={(e) => handleStateUpdate(state.name, 'densityMultiplier', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{t('admin.population')}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-black text-sm outline-none"
                                        value={state.population}
                                        onChange={(e) => handleStateUpdate(state.name, 'population', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredStates.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            {t('common.no_data')}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Reach Discounts (%) */}
            <div className="glass-panel rounded-[2rem] p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <TrendingUp className="text-orange-400" size={24} />
                    <h2 className="text-xl font-bold text-white">{t('admin.discounts')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">{t('admin.region_discount')}</label>
                            <span className="text-2xl font-black text-primary">{(localPricing.discounts.state * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="0.5" step="0.01"
                            className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            value={localPricing.discounts.state}
                            onChange={(e) => handleDiscountChange('state', e.target.value)}
                        />
                        <p className="text-xs text-slate-500 font-medium italic">{t('admin.region_discount_desc')}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">{t('admin.country_discount')}</label>
                            <span className="text-2xl font-black text-orange-400">{(localPricing.discounts.national * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="0.8" step="0.01"
                            className="w-full accent-orange-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            value={localPricing.discounts.national}
                            onChange={(e) => handleDiscountChange('national', e.target.value)}
                        />
                        <p className="text-xs text-slate-500 font-medium italic">{t('admin.country_discount_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPricing;
