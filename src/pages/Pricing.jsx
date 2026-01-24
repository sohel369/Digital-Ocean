import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Globe, Layout, Building2, ChevronRight, Info, ChevronDown } from 'lucide-react';
import { PaymentModal } from '../components/PaymentCheckout';
import { useNavigate } from 'react-router-dom';

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
    const { pricingData, formatCurrency, convertPrice, t, country, formatIndustryName, user, addCampaign, currency } = useApp();

    const [selectedIndustry, setSelectedIndustry] = useState({ name: 'Tech', multiplier: 1.0 });
    const [selectedAdType, setSelectedAdType] = useState({ name: 'Display', baseRate: 15.0 });
    const [coverageArea, setCoverageArea] = useState('radius');
    const [selectedState, setSelectedState] = useState({ name: 'New York', landMass: 54000, densityMultiplier: 1.2 });
    const [postcode, setPostcode] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [tempCampaignId, setTempCampaignId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Sync defaults
    React.useEffect(() => {
        if (pricingData?.industries?.length > 0) {
            const defaultInd = user?.industry ? pricingData.industries.find(i => i.name.toLowerCase() === user.industry.toLowerCase()) : pricingData.industries[0];
            if (defaultInd) setSelectedIndustry(defaultInd);
        }
        if (pricingData?.adTypes?.length > 0) {
            const validTypes = pricingData.adTypes.filter(a => a.name !== 'Video');
            if (validTypes.length > 0) setSelectedAdType(validTypes[0]);
        }
        const countryStates = (pricingData?.states || []).filter(s => s.countryCode === country);
        if (countryStates.length > 0) setSelectedState(countryStates[0]);
    }, [pricingData, user, country]);

    const RADIUS_AREA = 2827;
    const calculation = useMemo(() => {
        if (!pricingData?.industries?.length) return { basePrice: 0, finalPrice: 0, sections: "0.00", discountPercent: "0", areaDescription: "" };
        let sections = 1, discount = 0, areaDescription = t('pricing.radius_desc', { radius: 30 });
        if (coverageArea === 'state' && selectedState) {
            sections = (selectedState.landMass / RADIUS_AREA) * selectedState.densityMultiplier;
            discount = pricingData.discounts?.state || 0;
            areaDescription = t('pricing.state_desc', { state: selectedState.name });
        } else if (coverageArea === 'national') {
            sections = (pricingData.states || []).reduce((acc, s) => acc + (s.landMass / RADIUS_AREA * s.densityMultiplier), 0);
            discount = pricingData.discounts?.national || 0;
            areaDescription = t('pricing.national_desc');
        }
        const rawBase = sections * (selectedAdType?.baseRate || 0) * (selectedIndustry?.multiplier || 1.0);
        const basePrice = convertPrice(rawBase, pricingData.currency);
        const discountAmt = basePrice * discount;
        return { basePrice, discountAmt, finalPrice: basePrice - discountAmt, sections: sections.toFixed(2), discountPercent: (discount * 100).toFixed(0), areaDescription };
    }, [coverageArea, selectedState, selectedAdType, selectedIndustry, pricingData, t, convertPrice]);

    const handleNextStep = async () => {
        setIsCreating(true);
        try {
            const campaignData = {
                name: `Campaign: ${selectedIndustry.name} - ${new Date().toLocaleDateString()}`,
                budget: calculation.finalPrice,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                status: 'draft',
                format: selectedAdType.name,
                industry: selectedIndustry.name,
                headline: `Special Offer from ${selectedIndustry.name}`,
                description: `Experience the premium reach of ${selectedIndustry.name} demographics.`,
                landing_page_url: "https://example.com",
                meta: { industry: selectedIndustry.name, coverage: coverageArea, location: coverageArea === 'state' ? selectedState.name : (postcode || '90210'), country, cta: "Learn More" }
            };
            const saved = await addCampaign(campaignData);
            if (saved?.id) {
                setTempCampaignId(saved.id);
                setIsCheckoutOpen(true);
            }
        } catch (error) {
            console.error("Quick Launch Failure:", error);
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
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t('campaign.format')}</label>
                                <CustomSelect value={selectedAdType.name} options={pricingData.adTypes.filter(a => a.name !== 'Video')} onChange={setSelectedAdType} t={t} formatName={(n) => n} type="formats" placeholder="Select Format" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] relative z-10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8"><MapPin size={24} className="text-primary" />{t('pricing.reach')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                            {[{ id: 'radius', label: t('campaign.radius_30'), icon: MapPin }, { id: 'state', label: t('campaign.state_wide'), icon: Building2 }, { id: 'national', label: t('campaign.national'), icon: Globe }].map(opt => (
                                <button key={opt.id} onClick={() => setCoverageArea(opt.id)} className={`p-6 rounded-2xl text-left border-2 transition-all flex flex-col gap-3 ${coverageArea === opt.id ? 'bg-primary/10 border-primary text-white shadow-lg' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                                    <opt.icon size={28} className={coverageArea === opt.id ? 'text-primary' : 'text-slate-600'} />
                                    <span className="font-bold text-sm uppercase tracking-wider">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {coverageArea === 'radius' && (
                            <input type="text" className="w-full sm:w-72 bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50" placeholder={t('campaign.postcode_placeholder')} value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                        )}

                        {coverageArea === 'state' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {pricingData.states.filter(s => s.countryCode === country).map(s => (
                                    <button key={s.name} onClick={() => setSelectedState(s)} className={`px-4 py-3 rounded-xl text-xs font-black transition-all border ${selectedState.name === s.name ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-800/40 text-slate-400 border-white/5'}`}>{s.name}</button>
                                ))}
                            </div>
                        )}

                        {coverageArea === 'national' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex gap-6 items-center">
                                <Globe size={48} className="text-emerald-400" />
                                <div>
                                    <h4 className="font-black text-emerald-400 text-lg uppercase">{t('pricing.national_bulk_discount', { discount: (pricingData.discounts?.national * 100).toFixed(0) })}</h4>
                                    <p className="text-sm text-slate-400 font-medium">Maximum efficiency pricing for country-wide market penetration.</p>
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
                                <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">{t('pricing.reach_label')}</span><span className="text-slate-200 font-bold text-right">{calculation.areaDescription} (x{calculation.sections})</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-slate-400">{t('pricing.subtotal')}</span><span className="font-bold text-white">{formatCurrency(calculation.basePrice)}</span></div>
                                {calculation.discountAmt > 0 && <div className="flex justify-between text-sm text-emerald-400 italic"><span>{t('pricing.saving')} ({calculation.discountPercent}%)</span><span className="font-bold">-{formatCurrency(calculation.discountAmt)}</span></div>}
                            </div>
                            <div className="pt-6">
                                <div className="flex flex-col items-end mb-6">
                                    <span className="text-4xl font-black text-white tracking-tighter">{formatCurrency(calculation.finalPrice)}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('pricing.monthly_est')}</span>
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
