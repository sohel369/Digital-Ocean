import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UploadCloud, DollarSign, X, MapPin, Globe, Building2, ChevronRight, ChevronDown, ShieldAlert, Clock } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdPreview from '../components/AdPreview';
import { getGeoConfig } from '../config/geoData';

const CampaignCreation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { campaigns, addCampaign, updateCampaign, submitCampaignForReview, pricingData, country, currency, CONSTANTS, t, adFormats, ctaOptions, formatIndustryName, convertPrice, formatCurrency, user } = useApp();
    const currentCurrency = CONSTANTS.CURRENCIES.find(c => c.code === currency) || { symbol: '$' };

    // Find existing campaign if editing
    const existingCampaign = id ? campaigns.find(c => c.id === parseInt(id)) : null;

    const [formData, setFormData] = useState({
        name: existingCampaign?.name || '',
        budget: existingCampaign?.budget?.toString() || '2500',
        startDate: existingCampaign?.startDate || '',
        endDate: existingCampaign?.end_date || '', // Fixed key name
        headline: existingCampaign?.headline || '',
        description: existingCampaign?.description || '',
        cta: existingCampaign?.meta?.cta || 'Learn More',
        landingPageUrl: existingCampaign?.landing_page_url || '',
        industry: existingCampaign?.meta?.industry || user?.industry || pricingData.industries[0]?.name || '',
        coverageArea: existingCampaign?.meta?.coverage || 'radius',
        targetState: existingCampaign?.meta?.location || pricingData.states.find(s => s.countryCode === country)?.name || (pricingData.states[0]?.name || ''),
        postcode: existingCampaign?.meta?.location || '',
        format: existingCampaign?.ad_format || adFormats[0]?.id || 'mobile_leaderboard',
        image: existingCampaign?.image || null,
        radius: existingCampaign?.meta?.radius || 30,
        status: existingCampaign?.status || 'draft'
    });

    const isReadOnly = ['pending_review', 'approved', 'active'].includes(formData.status);

    // Sync form with existing campaign if it loads later
    React.useEffect(() => {
        if (existingCampaign) {
            setFormData({
                name: existingCampaign.name || '',
                budget: existingCampaign.budget?.toString() || '2500',
                startDate: existingCampaign.startDate || '',
                endDate: existingCampaign.end_date || '',
                headline: existingCampaign.headline || '',
                description: existingCampaign.description || '',
                cta: existingCampaign.meta?.cta || 'Learn More',
                landingPageUrl: existingCampaign.landing_page_url || '',
                industry: existingCampaign.meta?.industry || user?.industry || '',
                coverageArea: existingCampaign.meta?.coverage || 'radius',
                targetState: existingCampaign.meta?.coverage === 'state' ? existingCampaign.meta?.location : '',
                postcode: existingCampaign.meta?.coverage === 'radius' ? existingCampaign.meta?.location : '',
                format: existingCampaign.ad_format || 'mobile_leaderboard',
                image: existingCampaign.image || null,
                radius: existingCampaign.meta?.radius || 30,
                status: existingCampaign.status || 'draft'
            });
        }
    }, [existingCampaign]);

    const geoConfig = getGeoConfig(country);
    const filteredStates = geoConfig.regions || [];

    const handleInputChange = (e) => {
        if (isReadOnly) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileDrop = (e) => {
        if (isReadOnly) return;
        e.preventDefault();
        const file = e.dataTransfer?.files[0] || e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e, isDraft = false) => {
        if (e) e.preventDefault();
        if (isReadOnly) return;

        // Final validation
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            alert(t('campaign.validation_error'));
            return;
        }

        const config = {
            id: id ? parseInt(id) : undefined,
            name: formData.name,
            budget: parseFloat(formData.budget),
            startDate: formData.startDate,
            endDate: formData.endDate,
            // If it's a draft, keep it as draft. If it was rejected and we're submitting, set to pending_review.
            status: isDraft ? 'draft' : 'pending_review',
            ad_format: formData.format,
            headline: formData.headline,
            description: formData.description,
            image: formData.image,
            landing_page_url: formData.landingPageUrl,
            meta: {
                industry: formData.industry,
                coverage: formData.coverageArea,
                location: formData.coverageArea === 'state' ? formData.targetState : formData.postcode,
                country: country,
                cta: formData.cta,
                radius: formData.radius
            }
        };

        try {
            if (id) {
                await updateCampaign(config);
            } else {
                await addCampaign(config);
            }
            if (!isDraft) {
                navigate('/');
            }
        } catch (error) {
            console.error("Submission failed:", error);
        }
    };

    const coverageOptions = [
        { id: 'radius', label: t('campaign.radius_30'), icon: MapPin },
        { id: 'state', label: t('campaign.state_wide'), icon: Building2 },
        { id: 'national', label: t('campaign.national'), icon: Globe }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-700">

            {/* Form Section */}
            <div className="lg:col-span-7 space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-white italic">{t('campaign.launch')} <span className="text-primary">{t('campaign.campaign')}</span></h1>
                    <p className="text-slate-400 mt-1 font-medium">{t('campaign.define_target')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* General Info */}
                    <div className="glass-panel rounded-3xl p-8 space-y-6">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-white/5 pb-4">1. {t('campaign.basics')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.name')}</label>
                                <input
                                    type="text" name="name" required
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={t('campaign.name_placeholder')}
                                    value={formData.name} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.industry')}</label>
                                <div className="w-full bg-slate-900/30 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-slate-400 text-xs sm:text-sm cursor-not-allowed">
                                    {/* Display registered industry */}
                                    {t(`industry.${(formData.industry || '').toLowerCase().replace(/ /g, '_')}`) || formData.industry || formatIndustryName(formData.industry)}
                                    <span className="block text-[10px] text-slate-600 mt-1 uppercase tracking-wider font-bold">
                                        {t('campaign.locked_industry_desc')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.start_date')}</label>
                                <input
                                    type="date" name="startDate" required
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark] ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={formData.startDate} onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.duration_label')}</label>
                                <div className="relative group">
                                    <select
                                        name="duration"
                                        disabled={isReadOnly}
                                        className={`w-full bg-slate-900 border border-slate-700/20 rounded-2xl px-5 py-3.5 text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.duration || '1'}
                                        onChange={(e) => {
                                            if (isReadOnly) return;
                                            const months = parseInt(e.target.value);
                                            // Calculate end date based on start date + months
                                            if (formData.startDate) {
                                                const start = new Date(formData.startDate);
                                                const end = new Date(start.setMonth(start.getMonth() + months));
                                                setFormData(prev => ({
                                                    ...prev,
                                                    duration: e.target.value,
                                                    endDate: end.toISOString().split('T')[0]
                                                }));
                                            } else {
                                                setFormData(prev => ({ ...prev, duration: e.target.value }));
                                            }
                                        }}
                                    >
                                        <option value="1" className="bg-[#0f172a] text-slate-100">{t('campaign.duration_1_month')}</option>
                                        <option value="3" className="bg-[#0f172a] text-slate-100">{t('campaign.duration_3_months')}</option>
                                        <option value="6" className="bg-[#0f172a] text-slate-100">{t('campaign.duration_6_months')}</option>
                                        <option value="12" className="bg-[#0f172a] text-slate-100">{t('campaign.duration_12_months')}</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Targeting */}
                    <div className="glass-panel rounded-3xl p-8 space-y-6">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-white/5 pb-4">2. {t('campaign.geo_target')}</h3>

                        <div className="flex flex-wrap gap-2">
                            {coverageOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => !isReadOnly && setFormData(p => ({ ...p, coverageArea: opt.id }))}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] sm:text-sm font-bold transition-all border-2 ${formData.coverageArea === opt.id
                                        ? 'bg-primary/10 border-primary text-primary-light shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                        } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <opt.icon size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {formData.coverageArea === 'radius' && (
                            <div className="animate-in slide-in-from-top-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.postcode')}</label>
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="text" name="postcode"
                                            disabled={isReadOnly}
                                            className={`w-full md:w-64 bg-slate-900/50 border ${formData.postcode && !geoConfig.postcodeRegex.test(formData.postcode) ? 'border-red-500' : 'border-slate-700/50'} rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            placeholder={t('campaign.postcode_placeholder')}
                                            value={formData.postcode} onChange={handleInputChange}
                                        />
                                        {formData.postcode && !geoConfig.postcodeRegex.test(formData.postcode) && (
                                            <span className="text-[10px] text-red-500 font-bold ml-2">Invalid format. Expected: {geoConfig.postcodeFormat}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                        <span>{t('geo.radius')}: {formData.radius} {t('geo.miles') || 'Miles'}</span>
                                        <div className="text-right">
                                            <span className="text-primary block">{t('geo.est_reach')}: {(formData.radius * 2500).toLocaleString()} {t('geo.users')}</span>
                                            <span className="text-[8px] text-slate-500 font-medium italic">* Estimated based on density models.</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="5" max="100" step="5"
                                        disabled={isReadOnly}
                                        value={formData.radius || 30}
                                        onChange={(e) => !isReadOnly && setFormData(p => ({ ...p, radius: parseInt(e.target.value) }))}
                                        className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary ${isReadOnly ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                        <span>5 Miles</span>
                                        <span>100 Miles</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.coverageArea === 'state' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.select_region')}</label>
                                <select
                                    name="targetState"
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={formData.targetState} onChange={handleInputChange}
                                >
                                    {filteredStates.length > 0 ? (
                                        filteredStates.map(s => <option key={s.name} value={s.name} className="bg-[#0f172a] text-slate-100">{s.name}</option>)
                                    ) : (
                                        <option value="" className="bg-[#0f172a] text-slate-100">{t('common.no_data')}</option>
                                    )}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Creative Assets */}
                    <div className="glass-panel rounded-3xl p-8 space-y-6">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-white/5 pb-4">3. {t('campaign.creative')}</h3>

                        {/* File Upload */}
                        <div
                            className={`border-2 border-dashed border-slate-700/50 bg-slate-900/30 rounded-3xl p-10 text-center transition-all relative group ${isReadOnly ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-900/50 cursor-pointer'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={!isReadOnly ? handleFileDrop : undefined}
                        >
                            <input
                                type="file"
                                disabled={isReadOnly}
                                className={`absolute inset-0 w-full h-full opacity-0 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                onChange={handleFileDrop}
                                accept="image/png, image/jpeg, image/gif"
                            />
                            <div className="flex flex-col items-center">
                                <div className={`w-14 h-14 bg-primary/10 text-primary-light rounded-2xl flex items-center justify-center mb-4 transition-transform ${!isReadOnly && 'group-hover:scale-110'}`}>
                                    <UploadCloud size={28} />
                                </div>
                                <p className="text-sm font-bold text-slate-200 uppercase tracking-wide">{t('campaign.click_to_upload')}</p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">{t('campaign.optimal_size')}</p>
                            </div>
                        </div>

                        {formData.image && (
                            <div className="relative inline-block mt-4 animate-in zoom-in-95">
                                <img src={formData.image} alt={t('campaign.live_preview')} className="h-24 w-auto rounded-2xl border border-white/10 shadow-2xl" />
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, image: null }))}
                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.headline')}</label>
                                <input
                                    type="text" name="headline" maxLength={50}
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={t('campaign.headline_placeholder')}
                                    value={formData.headline} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.description')}</label>
                                <textarea
                                    name="description" rows={3} maxLength={150}
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-slate-600 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={t('campaign.description_placeholder')}
                                    value={formData.description} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.landing_page')}</label>
                                <input
                                    type="url" name="landingPageUrl"
                                    disabled={isReadOnly}
                                    className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder="https://example.com"
                                    value={formData.landingPageUrl} onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.format')}</label>
                                <div className="relative group">
                                    <select
                                        name="format"
                                        disabled={isReadOnly}
                                        className={`w-full bg-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer pr-10 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.format}
                                        onChange={handleInputChange}
                                    >
                                        {pricingData.adTypes
                                            .filter(a => a.name !== 'Video')
                                            .map(a => (
                                                <option key={a.name} value={a.name} className="bg-[#0f172a] text-slate-100">
                                                    {t(`formats.${a.name.split('(')[0].trim().toLowerCase().replace(/ /g, '_')}`) || a.name}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.cta')}</label>
                                <div className="relative group">
                                    <select
                                        name="cta"
                                        disabled={isReadOnly}
                                        className={`w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer pr-10 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.cta} onChange={handleInputChange}
                                    >
                                        {ctaOptions.map(o => (
                                            <option key={o} value={o} className="bg-[#0f172a] text-slate-100">
                                                {t(`campaign.${o}`) || o}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="glass-panel rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">4. {t('campaign.cost_title')}</h3>
                            {/* "Pay As You Go" badge removed to reflect Fixed Monthly Pricing model */}
                        </div>

                        {/* Pricing Estimation Card */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{t('campaign.monthly_rate') || 'Fixed Monthly Rate'} ({t(`formats.${formData.format}`) || formData.format})</span>
                                <span className="text-slate-200 font-mono">
                                    {/* Dynamic Price Display */}
                                    {(() => {
                                        // Find base rate for selected format
                                        const rate = pricingData.adTypes.find(a => a.name.toLowerCase() === formData.format.replace('_', ' ').toLowerCase())?.baseRate || 100;
                                        // Convert from specific source currency (e.g. THB) to user display currency
                                        const converted = convertPrice(rate, pricingData.currency);
                                        return formatCurrency(converted);
                                    })()}
                                    /month
                                </span>
                            </div>
                            {/* Multiplier Hidden for Advertiser */}
                            {false && (
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{t('campaign.industry_multiplier')} ({formatIndustryName(formData.industry)})</span>
                                    <span className="text-primary font-bold">
                                        x{pricingData.industries.find(i => i.name === formData.industry)?.multiplier || 1.0}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase">{t('campaign.total_cost_fixed') || 'Total Fixed Investment'}</label>
                            <div className="relative max-w-xs">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl italic">{currentCurrency.symbol}</div>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-4 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-primary/50 cursor-not-allowed opacity-80"
                                    value={(() => {
                                        // Calculate Monthly Rate
                                        const industryData = pricingData.industries.find(i => i.name.toLowerCase() === (formData.industry || '').toLowerCase()) || pricingData.industries[0];
                                        const monthlyRate = (industryData?.baseRate || 1000) *
                                            (industryData?.multiplier || 1.0) *
                                            (formData.coverageArea === 'national' ? 5 : formData.coverageArea === 'state' ? 2 : 1);

                                        // Apply Duration Multiplier
                                        const duration = parseInt(formData.duration || '1');
                                        let total = monthlyRate * duration;

                                        // Apply Duration Discounts (Synced with backend/app/pricing.py tiers)
                                        // 3+ Months = 5%, 6+ Months = 10%, 12+ Months = 15%
                                        if (duration >= 12) total *= 0.85; // 15% off
                                        else if (duration >= 6) total *= 0.90; // 10% off
                                        else if (duration >= 3) total *= 0.95; // 5% off

                                        return convertPrice(total, pricingData.currency).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        });
                                    })()}
                                />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                {t('campaign.cost_note')}
                            </p>
                            {/* Pricing Visibility Adjustment Note */}
                            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider mt-2">
                                * {t('campaign.pricing_adjustment_note', { coverage: formData.coverageArea === 'radius' ? 'Local' : formData.coverageArea === 'state' ? 'Regional' : 'National' })}
                            </p>
                        </div>
                    </div>
                    {isReadOnly && (
                        <div className="pt-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-blue-400">
                                {formData.status === 'rejected'
                                    ? t('campaign.status_rejected_msg')
                                    : t('campaign.status_msg', { status: formData.status.replace('_', ' ') })}
                            </p>
                        </div>
                    )}

                    {!isReadOnly && (
                        <div className="pt-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                            <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-500">
                                <ShieldAlert size={16} />
                            </div>
                            <p className="text-xs font-bold text-amber-500/90">{t('campaign.approval_alert')}</p>
                        </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            className="flex-1 py-4 border border-slate-800 rounded-2xl text-slate-400 font-bold uppercase transition-all hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => navigate('/')}
                        >
                            {t('common.discard') || 'Discard'}
                        </button>

                        {!isReadOnly && (
                            <button
                                type="button"
                                className="flex-1 py-4 border border-slate-700 bg-slate-800/30 rounded-2xl text-slate-300 font-bold uppercase transition-all hover:bg-slate-800/60"
                                onClick={() => handleSubmit(null, true)}
                            >
                                {t('campaign.save_draft')}
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isReadOnly}
                            className={`flex-[2] py-4 rounded-2xl text-lg group font-black italic transition-all ${isReadOnly ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'premium-btn text-white'}`}
                        >
                            {isReadOnly ? (formData.status === 'approved' ? t('campaign.status_approved_caps') : t('campaign.status_under_review_caps')) : (formData.status === 'rejected' ? t('campaign.resubmit_campaign_caps') : t('campaign.submit').toUpperCase())}
                            {!isReadOnly && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform inline ml-1" />}
                        </button>
                    </div>
                </form>
            </div >

            {/* Preview Section */}
            < div className="lg:col-span-5 relative" >
                <div className="sticky top-24">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest pl-4">{t('campaign.live_preview') || 'Live Preview'}</h3>
                    <div className="max-w-full overflow-hidden rounded-3xl">
                        <AdPreview
                            formData={formData}
                        />
                    </div>
                </div>
            </div >
        </div >
    );
};

export default CampaignCreation;

