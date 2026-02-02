import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Globe, Layout, Building2, ChevronRight, Info, ChevronDown, Navigation } from 'lucide-react';
import { PaymentModal } from '../components/PaymentCheckout';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CustomSelect = ({ value, options, onChange, formatName, t, type, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.name === value);

    return (
        <div className={`relative ${isOpen ? 'z-[9999]' : 'z-auto'}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 font-bold text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
            >
                <span className="truncate">
                    {selectedOption ? (t(`${type}.${(selectedOption.name || '').toLowerCase().replace(/ /g, '_').replace(/[()]/g, '')}`) || selectedOption.displayName || formatName(selectedOption.name)) : placeholder}
                </span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[9999] mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2">
                        {options.map((option) => (
                            <button
                                key={option.name} type="button"
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${value === option.name ? 'bg-primary/20 text-primary border border-primary/20' : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}`}
                            >
                                {value === option.name && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                <span className="truncate">{t(`${type}.${(option.name || '').toLowerCase().replace(/ /g, '_').replace(/[()]/g, '')}`) || option.displayName || formatName(option.name)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Pricing = () => {
    const navigate = useNavigate();
    const {
        pricingData,
        formatCurrency,
        convertPrice,
        t,
        country,
        formatIndustryName,
        user,
        addCampaign,
        currency,
        geoSettings,
        loadRegionsForCountry
    } = useApp();

    const [selectedIndustry, setSelectedIndustry] = useState({ name: 'Tech', multiplier: 1.0 });
    const [selectedAdType, setSelectedAdType] = useState({ name: 'Display', baseRate: 15.0 });
    const [coverageArea, setCoverageArea] = useState(geoSettings?.coverageArea || 'radius');
    const [selectedState, setSelectedState] = useState({ name: 'Select Region', landMass: 0, densityMultiplier: 1.0 });
    const [postcode, setPostcode] = useState(geoSettings?.postcode || '');
    const [duration, setDuration] = useState('3'); // Default 3 months
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [tempCampaignId, setTempCampaignId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Sync defaults - ONLY if not already modified by user
    React.useEffect(() => {
        if (pricingData?.industries?.length > 0 && selectedIndustry.name === 'Tech') {
            const defaultInd = user?.industry ? pricingData.industries.find(i => i.name.toLowerCase() === user.industry.toLowerCase()) : pricingData.industries[0];
            if (defaultInd) setSelectedIndustry(defaultInd);
        }
        if (pricingData?.adTypes?.length > 0 && selectedAdType.name === 'Display') {
            const validTypes = pricingData.adTypes.filter(a => a.name !== 'Video');
            if (validTypes.length > 0) setSelectedAdType(validTypes[0]);
        }
    }, [pricingData, user]);

    // Ensure regions are loaded for the current country if missing
    React.useEffect(() => {
        const hasRegions = pricingData.states.some(s => s.countryCode === country);
        if (!hasRegions && country) {
            console.log(`🔍 Pricing Page: Missing regions for ${country}, loading...`);
            loadRegionsForCountry(country);
        }
    }, [country, pricingData.states.length]);

    // Track initialization to avoid aggressive re-syncing
    const isInitialized = React.useRef(false);

    // Handle Country/State/Coverage sync from Global Geo Settings - ONLY ON MOUNT
    React.useEffect(() => {
        if (!isInitialized.current && pricingData?.states?.length > 0) {
            // 1. Sync Coverage Area
            if (geoSettings?.coverageArea) {
                setCoverageArea(geoSettings.coverageArea);
            }

            // 2. Sync Postcode
            if (geoSettings?.postcode) {
                setPostcode(geoSettings.postcode);
            }

            // 3. Sync State Selection
            const countryStates = (pricingData?.states || []).filter(s => s.countryCode === country);

            if (geoSettings?.coverageArea === 'state' && geoSettings?.targetState) {
                const target = countryStates.find(s => s.name === geoSettings.targetState);
                if (target) {
                    setSelectedState(target);
                } else if (countryStates.length > 0) {
                    setSelectedState(countryStates[0]);
                }
            } else if (countryStates.length > 0) {
                setSelectedState(countryStates[0]);
            }

            isInitialized.current = true;
        }
    }, [geoSettings, country, pricingData?.states]);

    const RADIUS_AREA = Math.PI * Math.pow(geoSettings?.radius || 30, 2);

    // STEP 4: Discount Logic (Duration based)
    const calculation = useMemo(() => {
        if (!pricingData?.industries?.length) return { basePrice: 0, finalPrice: 0, sections: "0.00", discountPercent: "0", areaDescription: "" };

        // STEP 3: Sync Radius from Geo Config
        const currentRadius = geoSettings?.radius || 30;
        let sections = 1, areaDescription = t('pricing.radius_desc', { radius: currentRadius });

        if (coverageArea === 'radius') {
            // Radius area calculation
            sections = 1; // Base unit is 1 standard radius
        } else if (coverageArea === 'state' && selectedState) {
            sections = (selectedState.landMass / RADIUS_AREA) * selectedState.densityMultiplier;
            areaDescription = t('pricing.state_desc', { state: selectedState.name });
        } else if (coverageArea === 'national') {
            sections = (pricingData.states || []).reduce((acc, s) => acc + (s.landMass / RADIUS_AREA * s.densityMultiplier), 0);
            areaDescription = t('pricing.national_desc');
        }

        const rawBase = sections * (selectedAdType?.baseRate || 0) * (selectedIndustry?.multiplier || 1.0);
        const basePrice = convertPrice(rawBase, pricingData.currency);

        // Duration Discount Calculation
        let durationDiscount = 0;
        const dur = parseInt(duration);
        if (dur >= 12) durationDiscount = 0.50;      // 50% for 12 months
        else if (dur >= 6) durationDiscount = 0.25;  // 25% for 6 months

        // Combine with coverage/volume discounts if needed, but for now we prioritize the duration discount request
        // The user asked specifically for: "Monthly price = base - discount"

        const monthlyPrice = basePrice * (1 - durationDiscount);

        return {
            basePrice,
            discountAmt: basePrice - monthlyPrice,
            finalPrice: monthlyPrice,
            sections: sections.toFixed(2),
            discountPercent: (durationDiscount * 100).toFixed(0),
            areaDescription
        };
    }, [coverageArea, selectedState, selectedAdType, selectedIndustry, pricingData, t, convertPrice, duration, geoSettings]);

    const handleNextStep = async () => {
        setIsCreating(true);
        try {
            // FIX: Ensure budget is never 0 and format numeric values correctly
            const cleanBudget = calculation.finalPrice > 0 ? calculation.finalPrice : 1.0;

            // FIX: Map frontend status "state" to match backend CoverageType enum ("state")
            // Backend Enum: RADIUS_30="30-mile", STATE="state", COUNTRY="country"
            let backendCoverageType = '30-mile';
            if (coverageArea === 'state') backendCoverageType = 'state';
            if (coverageArea === 'national') backendCoverageType = 'country';

            const campaignData = {
                name: `Campaign: ${selectedIndustry.name} - ${new Date().toLocaleDateString()}`,

                // Mapped Fields for Backend Schema (CampaignCreate)
                industry_type: selectedIndustry.name,               // was 'industry'
                start_date: new Date().toISOString().split('T')[0], // was 'startDate'
                end_date: new Date(new Date().setMonth(new Date().getMonth() + parseInt(duration))).toISOString().split('T')[0], // was 'endDate', added dynamic duration
                duration: parseInt(duration),
                budget: cleanBudget,
                coverage_type: backendCoverageType,                 // New required field
                ad_format: selectedAdType.name,                     // was 'format'

                // Optional/Meta fields
                target_state: coverageArea === 'state' ? selectedState.name : null,
                target_postcode: postcode || null,
                target_country: country,
                status: 'DRAFT',
                headline: `Special Offer from ${selectedIndustry.name}`,
                description: `Experience the premium reach of ${selectedIndustry.name} demographics.`,
                landing_page_url: "https://example.com",
                tags: ["quick-launch"]
            };

            console.log("🚀 Submitting Campaign Payload:", campaignData);

            const saved = await addCampaign(campaignData);
            if (saved?.id) {
                setTempCampaignId(saved.id);
                setIsCheckoutOpen(true);
            }
        } catch (error) {
            console.error("Quick Launch Failure:", error);
            // Ensure error is visible if not already handled by addCampaign
            if (!error.message?.includes('Session Expired')) {
                toast.error("Setup Failed", { description: "Could not create campaign draft. Please try again." });
            }
        } finally {
            setIsCreating(false);
        }
    };

    if (!pricingData?.industries?.length) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
            <header className="mb-12 text-center lg:text-left">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-3 italic uppercase">
                    {t('pricing.title')} <span className="text-primary-light">{t('pricing.subtitle')}</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-sm md:text-lg mx-auto lg:mx-0 font-medium">{t('pricing.description')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel p-8 rounded-[2rem] relative z-20">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8"><Layout size={24} className="text-primary" />{t('pricing.config')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.industry')}</label>
                                <CustomSelect value={selectedIndustry.name} options={pricingData.industries} onChange={setSelectedIndustry} t={t} formatName={formatIndustryName} type="industry" placeholder="Select Industry" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">&nbsp;</label>
                                <CustomSelect value={selectedAdType.name} options={pricingData.adTypes.filter(a => a.name !== 'Video')} onChange={setSelectedAdType} t={t} formatName={(n) => n} type="formats" placeholder="Select Format" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Commitment Duration (Save up to 50%)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[{ val: '3', label: '3 Months', discount: '0%' }, { val: '6', label: '6 Months', discount: '25%' }, { val: '12', label: '12 Months', discount: '50%' }].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setDuration(opt.val)}
                                            className={`group relative py-3 rounded-xl text-sm font-bold border transition-all ${duration === opt.val ? 'bg-primary text-white border-primary' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-white/5'}`}
                                        >
                                            {opt.label}
                                            {opt.discount !== '0%' && <span className="block text-[10px] text-emerald-400">Save {opt.discount}</span>}

                                            {/* Tooltip for Step 4 */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                {opt.val === '6' ? '25% discount for 6 months commitment' : (opt.val === '12' ? '50% discount for 12 months commitment' : 'Standard 3 months commitment')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3"><MapPin size={24} className="text-primary" />{t('pricing.reach')}</h3>
                            <button
                                onClick={() => navigate('/geo-targeting')}
                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary transition-all flex items-center gap-2 group"
                            >
                                <Navigation size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                Customize Reach
                            </button>
                        </div>

                        {/* Target Reach Selector */}
                        <div className="mb-6 space-y-3">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Target Reach</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'radius', label: 'Radius', icon: MapPin, desc: `${geoSettings?.radius || 30} miles` },
                                    { id: 'state', label: 'State Wide', icon: Building2, desc: 'Regional' },
                                    { id: 'national', label: 'National', icon: Globe, desc: 'Full country' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setCoverageArea(opt.id)}
                                        className={`group relative py-4 px-3 rounded-xl text-sm font-bold border transition-all ${coverageArea === opt.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-white/5 hover:border-primary/20'}`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <opt.icon size={20} className={coverageArea === opt.id ? 'text-white' : 'text-slate-500'} />
                                            <span className="block">{opt.label}</span>
                                            <span className={`block text-[10px] ${coverageArea === opt.id ? 'text-white/70' : 'text-slate-600'}`}>{opt.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Coverage Details Display */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between group hover:border-primary/30 transition-all duration-500">
                            <div className="flex gap-6 items-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                    {coverageArea === 'radius' ? <MapPin size={32} className="text-primary" /> :
                                        coverageArea === 'state' ? <Building2 size={32} className="text-primary" /> :
                                            <Globe size={32} className="text-primary" />}
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-lg uppercase tracking-tighter italic">
                                        {coverageArea === 'radius' ? `${geoSettings?.radius || 30} Mile Radius` :
                                            coverageArea === 'state' ? `State Wide: ${selectedState?.name || 'Region'}` :
                                                'National Coverage'}
                                    </h4>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {coverageArea === 'radius' ? `Targeting ${postcode || 'selected area'}` :
                                            coverageArea === 'state' ? `Full coverage of ${selectedState?.name}` :
                                                'Total country-wide market penetration'}
                                    </p>
                                </div>
                            </div>
                        </div>


                        {coverageArea === 'national' && (
                            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
                                <Globe size={32} className="text-emerald-400" />
                                <div>
                                    <h4 className="font-black text-emerald-400 text-sm uppercase">{t('pricing.national_bulk_discount', { discount: (pricingData.discounts?.national * 100).toFixed(0) })}</h4>
                                    <p className="text-xs text-slate-400 font-medium italic">Applied automatically for full nationwide reach.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="glass-panel p-8 rounded-[2rem] lg:sticky lg:top-24 bg-slate-950/80">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-full" />
                        <h3 className="text-xl font-bold text-white mb-8 italic uppercase tracking-tighter">{t('pricing.summary')}</h3>
                        <div className="space-y-6">
                            <div className="space-y-4 border-b border-white/5 pb-6">
                                <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">{t('pricing.config_label')}</span><span className="text-slate-200 font-bold text-right">{selectedAdType.name} @ {selectedIndustry.name}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">{t('pricing.reach_label')}</span><span className="text-slate-200 font-bold text-right">{calculation.areaDescription}</span></div>
                            </div>
                            {calculation.discountAmt > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">{t('pricing.subtotal')}</span><span className="font-bold text-white">{formatCurrency(calculation.basePrice)}</span></div>
                                    <div className="flex justify-between text-sm text-emerald-400 italic"><span>{t('pricing.saving')} ({calculation.discountPercent}%)</span><span className="font-bold">-{formatCurrency(calculation.discountAmt)}</span></div>
                                </div>
                            )}
                            <div className="pt-6">
                                <div className="flex flex-col items-end mb-6">
                                    <span className="text-4xl font-black text-white tracking-tighter">{formatCurrency(calculation.finalPrice)}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {t('pricing.monthly_est', { discount: calculation.discountPercent })}
                                        </span>
                                        {duration === '12' && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Locked in for 12 months</span>}
                                    </div>
                                </div>
                                <button onClick={handleNextStep} disabled={isCreating} className="w-full premium-btn py-4 rounded-xl text-lg font-black group shadow-lg shadow-primary/20 italic flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                    {isCreating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>{t('pricing.next_step')}<ChevronRight size={20} /></>}
                                </button>
                                <button onClick={() => navigate(`/campaigns/new?industry=${selectedIndustry.name}&format=${selectedAdType.name}&coverage=${coverageArea}&state=${selectedState.name}&postcode=${postcode}&budget=${calculation.finalPrice}`)} className="w-full mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors">Or Define Full Creative Details First</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} amount={calculation.finalPrice} currency={currency} campaignId={tempCampaignId} />
        </div>
    );
};

export default Pricing;
