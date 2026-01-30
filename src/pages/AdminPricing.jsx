import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, RefreshCcw, TrendingUp, Map, Briefcase, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

const AdminPricing = () => {
    const {
        pricingData, savePricingConfig, CONSTANTS, t,
        formatIndustryName, currency, country,
        isGeoLoading, loadRegionsForCountry, user
    } = useApp();
    const [localPricing, setLocalPricing] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const currentCurrency = CONSTANTS.CURRENCIES.find(c => c.code === currency) || { symbol: '$' };
    const [selectedCountry, setSelectedCountry] = useState(country);
    const [isCountryOpen, setIsCountryOpen] = useState(false);

    // Track which country we have locally loaded to prevent background refreshes 
    // from overwriting unsaved admin edits every 30 seconds.
    const [lastLoadedCountry, setLastLoadedCountry] = useState(null);

    // Sync local state when pricingData is loaded from backend
    React.useEffect(() => {
        if (pricingData?.industries?.length > 0) {
            // Check if we need to sync:
            // 1. First time loading (localPricing is null)
            // 2. Switched countries
            // 3. Global states for our selected country changed and we don't have them locally yet
            const hasLocalStates = localPricing?.states?.some(s => s.countryCode === selectedCountry);
            const hasGlobalStates = pricingData.states?.some(s => s.countryCode === selectedCountry);

            const shouldSync = !localPricing ||
                selectedCountry !== lastLoadedCountry ||
                (hasGlobalStates && !hasLocalStates);

            if (shouldSync) {
                // Deduplicate industries by name (case-insensitive, normalized)
                const seenIndustries = new Set();
                const uniqueIndustries = pricingData.industries.filter(ind => {
                    const normalizedName = (ind.name || '').toLowerCase().replace(/[-,]/g, ' ').replace(/\s+/g, ' ').trim();
                    if (seenIndustries.has(normalizedName)) return false;
                    seenIndustries.add(normalizedName);
                    return true;
                });

                // Deduplicate adTypes by name
                const seenAdTypes = new Set();
                const uniqueAdTypes = (pricingData.adTypes || []).filter(ad => {
                    const key = ad.name?.toLowerCase();
                    if (seenAdTypes.has(key)) return false;
                    seenAdTypes.add(key);
                    return true;
                });

                // When syncing, we merge. We don't want to lose states of other countries if they exist.
                setLocalPricing(prev => ({
                    ...pricingData,
                    industries: uniqueIndustries,
                    adTypes: uniqueAdTypes,
                    // Preserve other countries' states if we already had them
                    states: [
                        ...(prev?.states?.filter(s => s.countryCode !== selectedCountry) || []),
                        ...(pricingData.states || []).filter(s => s.countryCode === selectedCountry)
                    ]
                }));
                setLastLoadedCountry(selectedCountry);
            }
        }
    }, [pricingData, selectedCountry, lastLoadedCountry, localPricing]);

    // Sync selectedCountry with global country from Header
    React.useEffect(() => {
        if (country && country !== selectedCountry) {
            setSelectedCountry(country);
            // loadRegionsForCountry(country) is called via useApp context update usually
        }
    }, [country]);

    // Load country specific data when selectedCountry changes
    React.useEffect(() => {
        if (selectedCountry) {
            // Force managed country for Country Admins
            if (user?.role?.toLowerCase() === 'country_admin' && user?.managed_country) {
                const managed = user.managed_country.toUpperCase();
                if (selectedCountry !== managed) {
                    setSelectedCountry(managed);
                    return;
                }
            }
            loadRegionsForCountry(selectedCountry);
        }
    }, [selectedCountry, loadRegionsForCountry, user]);

    // Early return if data is not loaded yet
    if (!localPricing || !localPricing.industries || localPricing.industries.length === 0) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest">
                <RefreshCcw className="animate-spin text-primary" size={32} />
                {t('common.loading')}
            </div>
        );
    }

    const filteredStates = localPricing.states?.filter(s => s.countryCode === selectedCountry) || [];

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
        let processedValue = newValue;

        // Validation for Density Multiplier
        if (field === 'densityMultiplier') {
            const num = parseFloat(newValue);
            // Allow empty string for typing, but clamp valid numbers
            if (newValue !== '') {
                if (num > 5.0) processedValue = 5.0;
                else if (num < 0) processedValue = 0.5; // Prevent negative/zero logic issues
                else processedValue = num;
            }
        } else if (field === 'population') {
            // Population must be > 0 per backend schema validation
            const num = parseFloat(newValue);
            processedValue = num > 0 ? num : 1; // Default to 1 if invalid/empty
        } else if (field === 'radiusAreasCount') {
            // Radius areas must be positive integer
            const num = parseInt(newValue) || 1;
            processedValue = num > 0 ? num : 1;
        } else {
            processedValue = field === 'name' ? newValue : parseFloat(newValue) || 0;
        }

        setLocalPricing(prev => ({
            ...prev,
            states: prev.states.map(s =>
                s.name === stateName ? { ...s, [field]: processedValue } : s
            )
        }));
    };

    const handleDensityBlur = (stateName, value) => {
        // Enforce minimum of 0.5 on blur
        const num = parseFloat(value);
        if (num < 0.5) {
            handleStateUpdate(stateName, 'densityMultiplier', 0.5);
            toast.info("Density factor auto-adjusted to minimum 0.5");
        }
    };

    const handleSave = async () => {
        // Validate state data before sending
        const invalidStates = localPricing.states.filter(s =>
            !s.population || s.population <= 0 ||
            !s.densityMultiplier || s.densityMultiplier <= 0
        );

        if (invalidStates.length > 0) {
            toast.error("Validation Error", {
                description: `Please ensure all states have valid population (> 0) and density values. Invalid states: ${invalidStates.map(s => s.name).join(', ')}`
            });
            return;
        }

        setIsSaving(true);
        try {
            // Ensure we send the countryCode we are currently editing
            const success = await savePricingConfig({
                ...localPricing,
                countryCode: selectedCountry
            });

            if (!success) {
                console.error("❌ Pricing save returned success=false");
            }
        } catch (err) {
            console.error("❌ Critical error in handleSave:", err);
            toast.error("Save Failed", { description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    // CSV Template Data - STEP 2: Updated Columns
    // Columns: Country | Region | Population | Density | RadiusAreas | Price factor
    const csvTemplate = "Country,Region,Population,Density,RadiusAreas,PriceFactor\nUS,California,39538223,1.0,297,1.5\nUS,New York,20201249,1.67,372,2.0";
    const downloadTemplate = () => {
        const blob = new Blob([csvTemplate], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'regions_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
                        {t('admin.title')} <span className="text-primary">{t('admin.title_sub')}</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base font-medium mt-1">
                        {pricingData.description || 'Global configuration for industry multipliers and base rates.'}
                    </p>
                    {user?.role?.toLowerCase() === 'country_admin' && (
                        <div className="mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-flex items-center gap-3">
                            <Shield className="text-amber-500" size={16} />
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                                Managed Country Focus: {CONSTANTS.COUNTRIES.find(c => c.code === user.managed_country?.toUpperCase())?.name || user.managed_country}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={downloadTemplate}
                        className="w-full sm:w-auto bg-slate-800/80 border border-slate-700 text-slate-300 px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all italic font-bold cursor-pointer text-xs uppercase tracking-wide"
                    >
                        <Briefcase size={16} />
                        Download Template
                    </button>
                    <label className="w-full sm:w-auto bg-slate-800/80 border border-slate-700 text-slate-300 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all italic font-bold cursor-pointer">
                        <Save className="rotate-180" size={20} />
                        <span>Import CSV</span>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const text = event.target.result;
                                    const lines = text.split('\n');
                                    const headers = lines[0].split(',');
                                    const newStates = lines.slice(1).filter(l => l.trim()).map(line => {
                                        const values = line.split(',');
                                        // STEP 2: Updated Columns map: Country, Region, Population, Density, Price factor
                                        // Using smart detection or strict index-based mapping
                                        return {
                                            countryCode: values[0]?.trim(), // Country (e.g. US)
                                            name: values[1]?.trim(),        // Region (e.g. California)
                                            population: parseFloat(values[2]) || 0, // Population
                                            densityMultiplier: parseFloat(values[3]) || 1.0, // Density Factor
                                            radiusAreasCount: parseInt(values[4]) || 1, // Radius Areas
                                            priceFactor: parseFloat(values[5]) || 1.0, // Price Factor
                                        };
                                    }).map(s => ({
                                        ...s,
                                        // Combine density and price factor into the internal densityMultiplier field
                                        densityMultiplier: s.priceFactor || s.densityMultiplier || 1.0
                                    }));

                                    if (newStates.length > 0) {
                                        setLocalPricing(prev => {
                                            // Merge or replace states for the current country
                                            const otherStates = prev.states.filter(s => s.countryCode !== newStates[0].countryCode);
                                            return {
                                                ...prev,
                                                states: [...otherStates, ...newStates]
                                            };
                                        });
                                        // If imported country matches selection, it will update immediately
                                        const firstCountry = newStates[0].countryCode;
                                        if (firstCountry !== selectedCountry) {
                                            setSelectedCountry(firstCountry);
                                        }
                                        // CRITICAL: Update lastLoadedCountry so the sync effect doesn't overwrite our import
                                        setLastLoadedCountry(firstCountry);
                                        toast.success(`Imported ${newStates.length} regions for ${firstCountry}`);
                                    }
                                };
                                reader.readAsText(file);
                            }}
                        />
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto premium-btn px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 italic"
                    >
                        {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? t('admin.saving') : t('admin.save_config')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Industry Multipliers */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6 relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2 sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <Briefcase className="text-primary" size={24} />
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t('admin.industry_standards') || 'Industry Standards'}</h2>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10 pb-4">
                        {localPricing.industries.map((ind) => (
                            <div key={ind.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3 hover:border-primary/30 transition-colors">
                                <span className="text-slate-200 font-bold text-sm">
                                    {t(`industry.${ind.name.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '')}`) || ind.name}
                                </span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number" step="0.01"
                                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-primary-light font-black outline-none"
                                        value={ind.multiplier}
                                        onChange={(e) => handleMultiplierChange(ind.name, e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">x {t('admin.pricing_adjustment') || 'Pricing Adj.'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ad Type Base Rates */}
                <div className="glass-panel rounded-[2rem] p-8 space-y-6 relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2 sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md">
                        <TrendingUp className="text-emerald-500" size={24} />
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t('admin.base_rates')}</h2>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10 pb-4">
                        {localPricing.adTypes.map((ad) => (
                            <div key={ad.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 gap-3">
                                <span className="text-slate-200 font-bold text-sm">
                                    {t(`formats.${ad.name.split('(')[0].trim().toLowerCase().replace(/ /g, '_')}`)}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{currentCurrency.symbol}</span>
                                        <input
                                            type="number"
                                            className="w-28 bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-3 py-2 text-emerald-400 font-black outline-none"
                                            value={ad.baseRate}
                                            onChange={(e) => handleBaseRateChange(ad.name, e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t('admin.rate_short') || 'Rate'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geographic Factors */}
            <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Map className="text-blue-400" size={24} />
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t('admin.geo_weightings') || 'Regional Weighting'}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium italic">
                            * Industry Specific proprietary algorithm optimising ad reach when considering geographic location and population density.
                        </p>
                    </div>

                    <div className="relative min-w-[250px]">
                        <button
                            onClick={() => user?.role?.toLowerCase() !== 'country_admin' && setIsCountryOpen(!isCountryOpen)}
                            className={`w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-bold text-sm outline-none transition-all duration-200 shadow-sm ${user?.role?.toLowerCase() === 'country_admin' ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>{CONSTANTS.COUNTRIES.find(c => c.code === selectedCountry)?.flag}</span>
                                <span>{CONSTANTS.COUNTRIES.find(c => c.code === selectedCountry)?.name}</span>
                            </span>
                            {user?.role !== 'country_admin' && (
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCountryOpen ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {isCountryOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[55]"
                                    onClick={() => setIsCountryOpen(false)}
                                ></div>
                                <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto custom-scrollbar ring-1 ring-white/5">
                                    {CONSTANTS.COUNTRIES.map(c => (
                                        <div
                                            key={c.code}
                                            onClick={() => {
                                                setSelectedCountry(c.code);
                                                setIsCountryOpen(false);
                                            }}
                                            className={`
                                                flex items-center gap-3 p-4 cursor-pointer transition-colors
                                                ${selectedCountry === c.code ? 'bg-primary/10 text-primary border-l-4 border-l-primary' : 'text-slate-200 hover:bg-white/5 border-l-4 border-l-transparent'}
                                            `}
                                        >
                                            <span className="text-lg">{c.flag}</span>
                                            <span className="font-bold text-sm">{c.name}</span>
                                            {selectedCountry === c.code && <Check size={16} className="ml-auto" />}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[250px]">
                    {isGeoLoading && (
                        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center space-y-3">
                            <RefreshCcw className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest italic">Synchronizing Postcodes...</p>
                        </div>
                    )}

                    {filteredStates.map(state => (
                        <div key={state.name} className="p-5 bg-slate-900/30 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-start">
                                <h4 className="text-white font-bold">{state.name}</h4>
                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-black">{state.countryCode}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1 truncate">Density factor</label>
                                    <input
                                        type="number" step="0.1"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-black text-xs outline-none focus:border-primary transition-colors"
                                        value={state.densityMultiplier}
                                        onChange={(e) => handleStateUpdate(state.name, 'densityMultiplier', e.target.value)}
                                        onBlur={(e) => handleDensityBlur(state.name, e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1 truncate">Radius Areas</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-black text-xs outline-none focus:border-primary transition-colors"
                                        value={state.radiusAreasCount}
                                        onChange={(e) => handleStateUpdate(state.name, 'radiusAreasCount', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Targeting Population (2026)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-black text-xs outline-none focus:border-primary transition-colors"
                                        value={state.population}
                                        onChange={(e) => handleStateUpdate(state.name, 'population', e.target.value)}
                                    />
                                </div>

                                <div className="col-span-2 bg-slate-950/50 border border-white/5 rounded-xl p-3 space-y-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase">Land Mass</span>
                                        <span className="text-slate-300 font-black">{(state.landMass || 0).toLocaleString()} Sq Mi</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase">Density (Mi)</span>
                                        <span className={`font-black ${!state.densityMi && !state.landMass ? 'text-red-400' : 'text-primary-light'}`}>
                                            {state.densityMi || (state.landMass > 0 ? (state.population / state.landMass).toFixed(2) : '0')}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Target Multiplier</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">Rank #{state.rank || '-'}</span>
                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono text-[8px]">FIPS: {state.fips || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-primary font-black text-xl italic tracking-tighter">
                                            x{((state.radiusAreasCount || 1) * (state.densityMultiplier || 1)).toFixed(2)}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-black leading-none">{((state.populationPercent || 0) * 100).toFixed(2)}%</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">National Reach</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!isGeoLoading && filteredStates.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-900/20 border border-white/5 rounded-[2.5rem] text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                                <Map size={40} className="text-primary opacity-50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Geographic Data Missing</h3>
                                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
                                    We haven't populated the regional subdivisions for <span className="text-white">"{CONSTANTS.COUNTRIES.find(c => c.code === selectedCountry)?.name}"</span> yet.
                                </p>
                            </div>
                            <div className="pt-4">
                                <div className="inline-block px-8 py-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500">
                                    <p className="text-xs font-black uppercase tracking-widest mb-1 italic">Action Required</p>
                                    <p className="text-sm font-bold">Please supply the <span className="underline decoration-2">Countries & Subdivisions Spreadsheet</span></p>
                                    <p className="text-[10px] opacity-70 mt-1 italic italic">Required for Land Area, Population, and Density Matrix synchronization.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Reach Discounts (%) */}
            <div className="glass-panel rounded-[2rem] p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <TrendingUp className="text-orange-400" size={24} />
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t('admin.discounts')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Region Discount</label>
                                <p className="text-[10px] text-slate-600 italic">State-wide targeting benefit</p>
                            </div>
                            <span className="text-3xl font-black text-primary italic">{((localPricing.discounts?.state || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="0.5" step="0.01"
                            className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            value={localPricing.discounts?.state || 0}
                            onChange={(e) => handleDiscountChange('state', e.target.value)}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                            <span>0%</span>
                            <span>50%</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Country Discount</label>
                                <p className="text-[10px] text-slate-600 italic">National market penetration benefit</p>
                            </div>
                            <span className="text-3xl font-black text-orange-400 italic">{((localPricing.discounts?.national || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="0.8" step="0.01"
                            className="w-full accent-orange-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            value={localPricing.discounts?.national || 0}
                            onChange={(e) => handleDiscountChange('national', e.target.value)}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                            <span>0%</span>
                            <span>80%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPricing;