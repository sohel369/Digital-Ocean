import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Globe, Layout, Building2, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { PaymentModal } from '../components/PaymentCheckout';

const Pricing = () => {
    const { pricingData, formatCurrency, t, country, formatIndustryName, user } = useApp();
    const [selectedIndustry, setSelectedIndustry] = useState({ name: 'Tech', multiplier: 1.0 });
    const [selectedAdType, setSelectedAdType] = useState({ name: 'Display', baseRate: 15.0 });
    const [coverageArea, setCoverageArea] = useState('radius'); // 'radius', 'state', 'national'
    const [selectedState, setSelectedState] = useState({ name: 'New York', landMass: 54000, densityMultiplier: 1.2 });
    const [postcode, setPostcode] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Sync defaults when data arrives
    React.useEffect(() => {
        if (pricingData && pricingData.industries && pricingData.industries.length > 0) {
            // If user is logged in, force their industry
            if (user?.industry) {
                const userInd = pricingData.industries.find(i => i.name.toLowerCase() === user.industry.toLowerCase());
                if (userInd) {
                    setSelectedIndustry(userInd);
                }
            } else if (selectedIndustry.name === 'Tech') {
                setSelectedIndustry(pricingData.industries[0]);
            }
        }

        // Filter ad types to exclude 'Video' as requested
        const validAdTypes = (pricingData.adTypes || []).filter(a => a.name !== 'Video');
        if (validAdTypes.length > 0 && (selectedAdType.baseRate === 15.0 || selectedAdType.name === 'Video')) {
            setSelectedAdType(validAdTypes[0]);
        }

        // Fix: Properly filter states by current country for initial selection
        const countryStates = (pricingData.states || []).filter(s => s.countryCode === country);
        if (countryStates.length > 0 && (selectedState.name === 'New York' || selectedState.countryCode !== country)) {
            setSelectedState(countryStates[0]);
        }
    }, [pricingData, user, country]);

    // Pricing Logic Constants
    const RADIUS_AREA = 2827; // sq miles for 30 mile radius

    const calculation = useMemo(() => {
        if (!pricingData || !pricingData.industries || pricingData.industries.length === 0) {
            return {
                basePrice: 0,
                discountAmount: 0,
                finalPrice: 0,
                sections: "0.00",
                discountPercent: "0",
                areaDescription: ""
            };
        }

        let sections = 1;
        let discount = 0;
        let areaDescription = t('pricing.radius_desc', { radius: 30 });

        if (coverageArea === 'state' && selectedState) {
            const rawSections = selectedState.landMass / RADIUS_AREA;
            sections = rawSections * selectedState.densityMultiplier;
            discount = pricingData.discounts?.state || 0;
            areaDescription = t('pricing.state_desc', { state: selectedState.name });
        } else if (coverageArea === 'national') {
            const totalSections = (pricingData.states || []).reduce((acc, s) => acc + (s.landMass / RADIUS_AREA * s.densityMultiplier), 0);
            sections = totalSections;
            discount = pricingData.discounts?.national || 0;
            areaDescription = t('pricing.national_desc');
        }

        const basePrice = sections * (selectedAdType?.baseRate || 0) * (selectedIndustry?.multiplier || 1.0);
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
    }, [coverageArea, selectedState, selectedAdType, selectedIndustry, pricingData, t]);

    if (!pricingData.industries || pricingData.industries.length === 0) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">{t('common.loading')}...</p>
                </div>
            </div>
        );
    }

    const coverageOptions = [
        { id: 'radius', label: t('campaign.radius_30'), icon: MapPin },
        { id: 'state', label: t('campaign.state_wide'), icon: Building2 },
        { id: 'national', label: t('campaign.national'), icon: Globe }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
            <header className="mb-12 text-center lg:text-left">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3 italic uppercase">
                    {t('pricing.title')} <span className="text-primary-light">{t('pricing.subtitle')}</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-lg mx-auto lg:mx-0 font-medium">
                    {t('pricing.description')}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Consolidated Details */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2rem]">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8">
                            <Layout size={24} className="text-primary" />
                            {t('pricing.config')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.industry')}</label>
                                {user ? (
                                    <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 font-bold flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        {t(`industry.${(user.industry || '').toLowerCase().replace(/ /g, '_')}`) || formatIndustryName(user.industry)}
                                    </div>
                                ) : (
                                    <select
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 focus:ring-primary/50"
                                        value={selectedIndustry.name}
                                        onChange={(e) => setSelectedIndustry(pricingData.industries.find(i => i.name === e.target.value))}
                                    >
                                        {pricingData.industries.map(i => (
                                            <option key={i.name} value={i.name} className="bg-[#0f172a] text-slate-100">
                                                {t(`industry.${(i.name || '').toLowerCase().replace(/ /g, '_')}`) || i.displayName || formatIndustryName(i.name)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.format')}</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 focus:ring-primary/50"
                                    value={selectedAdType.name}
                                    onChange={(e) => setSelectedAdType(pricingData.adTypes.find(a => a.name === e.target.value))}
                                >
                                    {pricingData.adTypes
                                        .filter(a => a.name !== 'Video')
                                        .map(a => (
                                            <option key={a.name} value={a.name} className="bg-[#0f172a] text-slate-100">
                                                {t(`formats.${a.name.toLowerCase().replace(/ /g, '_')}`) || a.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Coverage Area */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2rem]">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8">
                            <MapPin size={24} className="text-primary" />
                            {t('pricing.reach')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                            {coverageOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setCoverageArea(option.id)}
                                    className={`p-6 rounded-2xl text-left transition-all border-2 flex flex-col gap-3 ${coverageArea === option.id
                                        ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                >
                                    <option.icon size={28} className={coverageArea === option.id ? 'text-primary' : 'text-slate-600'} />
                                    <span className="font-bold text-sm uppercase tracking-wider">{option.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="animate-in fade-in slide-in-from-top-4">
                            {coverageArea === 'radius' && (
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.postcode')}</label>
                                    <input
                                        type="text"
                                        className="w-full sm:w-72 bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder={t('campaign.postcode_placeholder')}
                                        value={postcode}
                                        onChange={(e) => setPostcode(e.target.value)}
                                    />
                                </div>
                            )}

                            {coverageArea === 'state' && (
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.select_region')}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {pricingData.states
                                            .filter(state => state.countryCode === country)
                                            .map(state => (
                                                <button
                                                    key={state.name}
                                                    onClick={() => setSelectedState(state)}
                                                    className={`px-4 py-3 rounded-xl text-xs font-black transition-all border ${selectedState.name === state.name
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {state.name}
                                                </button>
                                            ))}
                                        {pricingData.states.filter(state => state.countryCode === country).length === 0 && (
                                            <p className="col-span-full text-slate-500 text-sm italic py-4">{t('common.no_data')}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {coverageArea === 'national' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex gap-6 items-center">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <Globe size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-emerald-400 text-lg uppercase tracking-tight">{t('pricing.bulk_discount')}</h4>
                                        <p className="text-sm text-slate-400 font-medium">{t('pricing.bulk_discount_desc')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="lg:col-span-4">
                    <div className="glass-panel p-8 rounded-[2rem] sticky top-24 border-t-0 bg-slate-950/80">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-full" />

                        <h3 className="text-xl font-bold text-white mb-8">{t('pricing.summary')}</h3>

                        <div className="space-y-6">
                            {/* Details Section */}
                            <div className="space-y-4 border-b border-white/5 pb-6">
                                <div className="grid grid-cols-[80px_1fr] gap-4 text-sm items-start">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pt-1">{t('pricing.config_label')}</span>
                                    <span className="text-slate-200 font-bold text-right leading-snug break-words">
                                        {selectedAdType.name} <span className="text-slate-600 px-1">@</span> {selectedIndustry.name}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-4 text-sm items-start">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pt-1">{t('pricing.reach_label')}</span>
                                    <div className="text-right">
                                        <span className="text-slate-200 font-bold leading-snug block">{calculation.areaDescription}</span>
                                        <span className="text-slate-500 text-xs font-mono mt-0.5 block">(x{calculation.sections})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financials Section */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-[80px_1fr] gap-4 text-sm items-center">
                                    <span className="text-slate-400 font-medium">{t('pricing.subtotal')}</span>
                                    <span className="font-bold text-white text-right">{formatCurrency(calculation.basePrice)}</span>
                                </div>
                                {calculation.discountAmount > 0 && (
                                    <div className="grid grid-cols-[80px_1fr] gap-4 text-sm items-center text-emerald-400 italic">
                                        <span className="truncate">{t('pricing.saving')} <span className="opacity-75 text-xs not-italic">({calculation.discountPercent}%)</span></span>
                                        <span className="font-bold text-right">-{formatCurrency(calculation.discountAmount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Section */}
                            <div className="pt-6">
                                <div className="flex flex-col items-end gap-1 mb-6">
                                    <span className="text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black text-white tracking-tighter text-right break-all">
                                        {formatCurrency(calculation.finalPrice)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('pricing.monthly_est')}</span>
                                </div>

                                <button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full premium-btn py-4 rounded-xl text-lg font-black group shadow-lg shadow-primary/20 italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {t('pricing.next_step')}
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                amount={calculation.finalPrice}
            />
        </div>
    );
};

export default Pricing;
