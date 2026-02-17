import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UploadCloud, DollarSign, X, MapPin, Globe, Building2, ChevronRight, ChevronDown, ShieldAlert, Clock, Info, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import AdPreview from '../components/AdPreview';
import { getGeoConfig } from '../config/geoData';

const CampaignCreation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { campaigns, addCampaign, updateCampaign, initiatePayment, pricingData, country, currency, CONSTANTS, t, adFormats, ctaOptions, formatIndustryName, convertPrice, formatCurrency, user, geoSettings } = useApp();
    const currentCurrency = CONSTANTS.CURRENCIES.find(c => c.code === currency) || { symbol: '$' };

    // Find existing campaign if editing
    const existingCampaign = id ? campaigns.find(c => c.id === parseInt(id)) : null;

    // Parse URL Params (from Pricing Tool)
    const queryParams = new URLSearchParams(location.search);
    const initialIndustry = queryParams.get('industry') || existingCampaign?.meta?.industry || user?.industry || pricingData.industries[0]?.name || '';
    const initialFormat = queryParams.get('format') || existingCampaign?.ad_format || adFormats[0]?.id || 'mobile_leaderboard';
    const initialCoverage = queryParams.get('coverage') || existingCampaign?.meta?.coverage || 'radius';
    const initialState = queryParams.get('state') || existingCampaign?.meta?.location || pricingData.states.find(s => s.countryCode === country)?.name || (pricingData.states[0]?.name || '');
    const initialPostcode = queryParams.get('postcode') || existingCampaign?.meta?.location || geoSettings.postcode || '';
    const initialBudget = queryParams.get('budget') || existingCampaign?.budget?.toString() || '2500';

    const [formData, setFormData] = useState({
        name: existingCampaign?.name || '',
        budget: initialBudget,
        startDate: existingCampaign?.startDate || '',
        endDate: existingCampaign?.end_date || '', // Fixed key name
        headline: existingCampaign?.headline || '',
        description: existingCampaign?.description || '',
        cta: existingCampaign?.meta?.cta || 'Learn More',
        landingPageUrl: existingCampaign?.landing_page_url || '',
        industry: initialIndustry,
        coverageArea: initialCoverage,
        targetState: initialCoverage === 'state' ? initialState : '',
        postcode: initialCoverage === 'radius' ? initialPostcode : '',
        format: initialFormat,
        image: existingCampaign?.image || null,
        radius: existingCampaign?.meta?.radius || geoSettings.radius || 30,
        status: existingCampaign?.status || 'draft',
        duration: existingCampaign?.meta?.duration || '3'
    });

    const isReadOnly = ['pending_review', 'approved', 'active'].includes(formData.status);

    // Sync form with existing campaign or global geo settings
    React.useEffect(() => {
        if (existingCampaign) {
            setFormData(prev => ({
                ...prev,
                ...existingCampaign, // Spread all base fields
                endDate: existingCampaign.end_date || '',
                cta: existingCampaign.meta?.cta || 'Learn More',
                industry: existingCampaign.meta?.industry || user?.industry || '',
                coverageArea: existingCampaign.meta?.coverage || 'radius',
                targetState: existingCampaign.meta?.coverage === 'state' ? existingCampaign.meta?.location : '',
                postcode: existingCampaign.meta?.coverage === 'radius' ? existingCampaign.meta?.location : (geoSettings.postcode || ''),
                radius: existingCampaign.meta?.radius || geoSettings.radius || 30,
                duration: existingCampaign.meta?.duration || '3'
            }));
        } else {
            // New campaign - sync geo fields from global settings
            setFormData(prev => ({
                ...prev,
                coverageArea: geoSettings.coverageArea || 'radius',
                targetState: geoSettings.targetState || '',
                postcode: geoSettings.postcode || '',
                radius: geoSettings.radius || 30
            }));
        }
    }, [existingCampaign, geoSettings]);

    const geoConfig = getGeoConfig(country);
    const filteredStates = geoConfig.regions || [];

    const handleInputChange = (e) => {
        if (isReadOnly) return;
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate end date if start date changes
            if (name === 'startDate' && value) {
                const start = new Date(value);
                const months = parseInt(prev.duration || '3'); // Use current duration
                const end = new Date(start);
                end.setMonth(end.getMonth() + months);
                newData.endDate = end.toISOString().split('T')[0];
            }

            return newData;
        });
    };

    // Auto-calculate budget whenever influencing factors change
    React.useEffect(() => {
        const adTypeName = formData.format.replace(/_/g, ' ').toLowerCase();
        const formatData = pricingData.adTypes.find(a =>
            a.name.toLowerCase().includes(adTypeName) || adTypeName.includes(a.name.toLowerCase())
        ) || { baseRate: 100 };

        const industryData = pricingData.industries.find(i => i.name.toLowerCase() === (formData.industry || '').toLowerCase()) || { multiplier: 1.0 };

        // Coverage Multiplier - Simplified for Campaign Creation to match simplified UI
        // In radius mode it's 1.0. For state/national we use the same fallback multipliers as Pricing tool logic
        const coverageMulti = formData.coverageArea === 'national' ? 5 : (formData.coverageArea === 'state' ? 2.5 : 1.0);
        const monthlyRate = formatData.baseRate * (industryData.multiplier || 1.0) * coverageMulti;

        const durationMonths = parseInt(formData.duration || '3');
        let discount = 1.0;
        if (durationMonths >= 12) discount = 0.50;
        else if (durationMonths >= 6) discount = 0.75;

        const totalCost = monthlyRate * discount * durationMonths;

        // Update budget in state
        setFormData(prev => ({
            ...prev,
            budget: Math.round(totalCost).toString()
        }));
    }, [formData.format, formData.industry, formData.coverageArea, formData.duration, pricingData]);

    const handleFileDrop = (e) => {
        if (isReadOnly) return;
        e.preventDefault();
        const file = e.dataTransfer?.files[0] || e.target.files[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (!isImage && !isVideo) {
                alert("Please upload an image or video file.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (isImage) {
                    const img = new Image();
                    img.onload = () => {
                        const formatString = formData.format || '';
                        const formatKey = formatString.toLowerCase().replace(/ /g, '_').replace(/[()0-9x]/g, '').replace(/__+/g, '_').replace(/_$/, '');

                        const standardDims = {
                            'leaderboard': [728, 90],
                            'skyscraper': [160, 600],
                            'medium_rectangle': [300, 250],
                            'mobile_leaderboard': [320, 50],
                            'email_newsletter': [600, 200]
                        };

                        let targetW, targetH;
                        const match = formatString.match(/(\d+)x(\d+)/);

                        if (match) {
                            targetW = parseInt(match[1]);
                            targetH = parseInt(match[2]);
                        } else {
                            const foundKey = Object.keys(standardDims).find(k => formatKey.includes(k));
                            if (foundKey) {
                                [targetW, targetH] = standardDims[foundKey];
                            }
                        }

                        if (targetW && targetH) {
                            const targetRatio = targetW / targetH;
                            const actualRatio = img.width / img.height;
                            if (Math.abs(actualRatio - targetRatio) > 0.1) {
                                alert(`❌ WRONG ASPECT RATIO!\n\nTargeting ${targetW}x${targetH} ratio. Your image is ${img.width}x${img.height}.`);
                            }
                        }
                        setFormData(prev => ({ ...prev, image: reader.result }));
                    };
                    img.src = reader.result;
                } else {
                    // Video - skip dimension validation for now or add simple check
                    setFormData(prev => ({ ...prev, image: reader.result }));
                }
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
            name: formData.name,
            industry_type: formData.industry,
            start_date: formData.startDate,
            end_date: formData.endDate || null,
            duration: parseInt(formData.duration || '3'),
            budget: parseFloat(String(formData.budget).replace(/,/g, '')),
            coverage_type: formData.coverageArea === 'radius' ? '30-mile' : (formData.coverageArea === 'national' ? 'country' : 'state'),
            target_state: formData.coverageArea === 'state' ? formData.targetState : null,
            target_postcode: formData.coverageArea === 'radius' ? formData.postcode : null,
            target_country: country,
            status: isDraft ? 'DRAFT' : 'PENDING_REVIEW',
            ad_format: formData.format,
            headline: formData.headline,
            description: formData.description,
            landing_page_url: formData.landingPageUrl,
            tags: [],
            // We keep these for frontend state persistence if needed
            meta: {
                industry: formData.industry,
                coverage: formData.coverageArea,
                location: formData.coverageArea === 'state' ? formData.targetState : formData.postcode,
                country: country,
                cta: formData.cta,
                radius: formData.radius
            }
        };

        // If editing, we add the ID for the AppContext update helper, 
        // but note that the actual request will use it from the URL.
        if (id) {
            config.id = parseInt(id);
        }

        // Image handled as part of creative upload usually, but if the form has it:
        if (formData.image) config.image_base64 = formData.image;

        try {
            let savedCampaign;
            if (id) {
                savedCampaign = await updateCampaign(config);
            } else {
                savedCampaign = await addCampaign(config);
            }

            if (!isDraft) {
                // If it's a real submission, we now trigger Stripe
                if (savedCampaign && savedCampaign.id) {
                    await initiatePayment(savedCampaign.id, currency);
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Submission failed:", error);
        }
    };

    const coverageOptions = [
        { id: 'radius', label: t('sidebar.geo_targeting'), icon: MapPin },
        { id: 'national', label: t('campaign.national'), icon: Globe }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-700">

            {/* Form Section */}
            <div className="lg:col-span-7 space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        {t('campaign.launch')} <span className="text-primary">{t('campaign.campaign')}</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">{t('campaign.define_target')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* General Info */}
                    <div className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-white/5 pb-4">1. {t('campaign.basics')}</h3>

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
                                <div title={formData.industry} className="w-full bg-slate-900/30 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-slate-400 text-xs sm:text-sm cursor-not-allowed truncate">
                                    {/* Display registered industry */}
                                    {t(`industry.${(formData.industry || '').toLowerCase().replace(/ /g, '_')}`) || formData.industry || formatIndustryName(formData.industry)}
                                </div>
                                <span className="block text-[10px] text-slate-600 mt-1 uppercase tracking-wider font-bold">
                                    {t('campaign.locked_industry_desc')}
                                </span>
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
                                        value={formData.duration || '3'}
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

                    {/* 2. Geographic Targeting - Premium Summary View */}
                    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden group">
                        {/* Decorative background pulse */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                        <div className="flex justify-between items-center border-b border-white/5 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">2. {t('campaign.geo_target')}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t('geo.coverage_area')}</p>
                                </div>
                            </div>
                            <Link to="/geo-targeting" className="group flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-xl transition-all shadow-lg shadow-blue-500/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:text-white">Edit in Geo Targeting</span>
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-blue-500 group-hover:text-white" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Method Box */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-colors">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Geo Targeting</p>
                                    <p className="text-xl font-black text-white italic uppercase tracking-tighter">
                                        {geoSettings.coverageArea === 'radius' ? 'Custom Radius' : (geoSettings.coverageArea === 'state' ? 'Statewide' : 'National')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location Summary</p>
                                    <p className="text-sm font-bold text-primary-light">
                                        {geoSettings.coverageArea === 'radius'
                                            ? `${geoSettings.addressLabel || geoSettings.postcode || (country === 'US' ? 'Washinton D.C, US' : (country === 'AU' ? 'Sydney, AU' : 'Location Not Set'))} • ${geoSettings.radius} mile radius`
                                            : (geoSettings.coverageArea === 'state' ? `Full coverage of ${geoSettings.targetState || 'Region'}` : 'Full Australian Market Penetration')}
                                    </p>
                                </div>
                            </div>

                            {/* Reach Box */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-colors flex flex-col justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Reach</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-black text-white">
                                            {(() => {
                                                if (geoSettings.coverageArea === 'national') {
                                                    const total = pricingData.states
                                                        .filter(s => s.countryCode === country)
                                                        .reduce((sum, s) => sum + (s.population || 0), 0);
                                                    return total.toLocaleString();
                                                }
                                                if (geoSettings.coverageArea === 'state') {
                                                    const state = pricingData.states.find(s => s.name === geoSettings.targetState);
                                                    return (state?.population || 0).toLocaleString();
                                                }
                                                return (Math.floor(Math.PI * geoSettings.radius * geoSettings.radius * 35)).toLocaleString();
                                            })()}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Population</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    {geoSettings.lastUpdated ? (
                                        <div className="flex items-center gap-1 text-blue-400 font-bold uppercase tracking-wider bg-blue-400/5 px-2 py-1 rounded-lg border border-blue-400/10">
                                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                                            Live & Real Data
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-amber-500 font-bold uppercase tracking-wider bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10" title="Activates on launch">
                                            <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                                            Pending Activation
                                        </div>
                                    )}
                                    <p className="text-slate-500 font-black uppercase tracking-widest">
                                        Last updated: {geoSettings.lastUpdated ? new Date(geoSettings.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 px-5 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <Info size={16} className="text-blue-400 shrink-0" />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                                Location configurations are managed in the <Link to="/geo-targeting" className="text-blue-500 hover:underline underline-offset-4">Geo Targeting tab</Link> to ensure precise mapping and radius accuracy.
                            </p>
                        </div>
                    </div>

                    {/* Creative Assets */}
                    <div className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-widest border-b border-white/5 pb-4">3. {t('campaign.creative')}</h3>

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
                                accept="image/*,video/*"
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
                                {formData.image.startsWith('data:video/') ? (
                                    <video src={formData.image} className="h-24 w-auto rounded-2xl border border-white/10 shadow-2xl" controls muted />
                                ) : (
                                    <img src={formData.image} alt={t('campaign.live_preview')} className="h-24 w-auto rounded-2xl border border-white/10 shadow-2xl" />
                                )}
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
                                        {pricingData.adTypes.map(a => (
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
                    <div className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-widest">4. {t('campaign.cost_title')}</h3>
                            {/* "Pay As You Go" badge removed to reflect Fixed Monthly Pricing model */}
                        </div>

                        {/* Pricing Estimation Card */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{t('campaign.monthly_rate') || 'Fixed Monthly Rate'} ({t(`formats.${formData.format}`) || formData.format})</span>
                                <span className="text-slate-200 font-mono">
                                    {/* Dynamic Price Display */}
                                    {(() => {
                                        const adTypeName = formData.format.replace(/_/g, ' ').toLowerCase();
                                        const rate = pricingData.adTypes.find(a =>
                                            a.name.toLowerCase().includes(adTypeName) || adTypeName.includes(a.name.toLowerCase())
                                        )?.baseRate || 100;
                                        // Convert from specific source currency (e.g. THB) to user display currency
                                        const converted = convertPrice(rate, pricingData.currency);
                                        return formatCurrency(converted);
                                    })()}
                                    /month
                                </span>
                            </div>
                            {/* Multiplier Hidden for Advertiser */}
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{t('campaign.industry') || 'Industry'} ({formatIndustryName(formData.industry)})</span>
                                <span className="text-primary font-bold">
                                    Included
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">MONTHLY COMMITMENT</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 font-bold text-lg italic">{currentCurrency.symbol}</div>
                                        <div className="w-full bg-slate-900/30 border border-slate-700/30 rounded-xl pl-10 pr-5 py-3 text-xl font-bold text-slate-100 flex items-center justify-between min-h-[64px]">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {(() => {
                                                            const adTypeName = formData.format.replace(/_/g, ' ').toLowerCase();
                                                            const formatData = pricingData.adTypes.find(a =>
                                                                a.name.toLowerCase().includes(adTypeName) || adTypeName.includes(a.name.toLowerCase())
                                                            ) || { baseRate: 100 };
                                                            const industryData = pricingData.industries.find(i => i.name.toLowerCase() === (formData.industry || '').toLowerCase()) || { multiplier: 1.0 };
                                                            const monthlyRate = formatData.baseRate * (industryData.multiplier || 1.0) * (formData.coverageArea === 'national' ? 5 : (formData.coverageArea === 'state' ? 2.5 : 1.0));

                                                            const durationMonths = parseInt(formData.duration || '3');
                                                            let discount = 1.0;
                                                            if (durationMonths >= 12) discount = 0.50;
                                                            else if (durationMonths >= 6) discount = 0.75;

                                                            return convertPrice(monthlyRate * discount, pricingData.currency).toLocaleString(undefined, {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 0
                                                            });
                                                        })()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">/ Month</span>
                                                </div>
                                                {/* Detailed Pricing Breakdown for Clarity */}
                                                <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tight mt-0.5">
                                                    Fixed recurring installment
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                {/* Discount Note */}
                                                {(() => {
                                                    const dur = parseInt(formData.duration || '3');
                                                    if (dur === 12) return (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 font-black tracking-tighter shadow-[0_0_10px_rgba(59,130,246,0.1)]">50% DISCOUNT RECEIVED</span>
                                                            <span className="text-[8px] text-slate-500 italic">Total cost divided by 12 installments</span>
                                                        </div>
                                                    );
                                                    if (dur === 6) return (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 font-black tracking-tighter shadow-[0_0_10px_rgba(59,130,246,0.1)]">25% DISCOUNT RECEIVED</span>
                                                            <span className="text-[8px] text-slate-500 italic">Total cost divided by 6 installments</span>
                                                        </div>
                                                    );
                                                    return (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] text-slate-600 font-bold italic">Standard Rate Applied</span>
                                                            <span className="text-[8px] text-slate-500 italic mt-0.5">12 month campaigns attract 50% discount</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">TOTAL CAMPAIGN COST (FIXED)</label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl italic">{currentCurrency.symbol}</div>
                                        <input
                                            type="text"
                                            name="budget"
                                            readOnly
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-4 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-primary/50 opacity-80 cursor-not-allowed"
                                            value={formData.budget}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
                                <Info size={14} className="text-primary" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                                    Billed monthly via automated subscription. No total upfront payment required. Long-term bookings safeguard your costs against price inflation and ensure consistent premium placement exposure, even as audience numbers grow.
                                </p>
                            </div>

                            {/* Pricing Visibility Adjustment Note */}
                            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider mt-2">
                                * {t('campaign.pricing_adjustment_note', { coverage: formData.coverageArea === 'radius' ? 'Local' : formData.coverageArea === 'state' ? 'Regional' : 'National' })}
                            </p>
                        </div>
                    </div>
                    {isReadOnly && (
                        <div className="pt-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <div className="p-1.5 bg-primary/20 rounded-lg text-primary-light">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-primary-light">
                                {formData.status === 'rejected'
                                    ? t('campaign.status_rejected_msg')
                                    : t('campaign.status_msg', { status: formData.status.replace('_', ' ') })}
                            </p>
                        </div>
                    )}

                    {!isReadOnly && (
                        <div className="mx-1 pt-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                            <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                                <ShieldAlert size={16} />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-amber-500/90">{t('campaign.approval_alert')}</p>
                        </div>
                    )}

                    {/* Approval Flow Progress Demo */}
                    {!isReadOnly && (
                        <div className="glass-panel rounded-3xl p-6 space-y-4 border-primary/20 bg-primary/5">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="text-[10px] font-black text-primary-light uppercase tracking-widest italic flex items-center gap-2">
                                    <ShieldCheck size={14} /> Launch Sequence & Approval Flow
                                </h4>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Typical time: 2-4 Hours</span>
                            </div>

                            <div className="flex items-center justify-between relative px-2">
                                {/* Connector Line */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>

                                {/* Step 1 */}
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Submit</span>
                                </div>

                                {/* Step 2 */}
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-pulse">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-primary-light uppercase tracking-tighter">Admin Review</span>
                                </div>

                                {/* Step 3 */}
                                <div className="relative z-10 flex flex-col items-center gap-2 opacity-40">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5">
                                        <Zap size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Live & Running</span>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="pt-6 flex flex-col sm:flex-row items-stretch gap-4">
                        <button
                            type="button"
                            className="flex-1 py-4 px-6 border border-slate-800 rounded-2xl text-slate-500 font-black uppercase tracking-widest transition-all hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-400 disabled:opacity-50 text-[10px] sm:text-xs active:scale-95"
                            onClick={() => navigate('/')}
                        >
                            {t('common.discard') || 'Discard'}
                        </button>

                        {!isReadOnly && (
                            <button
                                type="button"
                                className="flex-1 py-4 px-6 border border-slate-700 bg-slate-900/40 rounded-2xl text-slate-300 font-black uppercase tracking-widest transition-all hover:bg-slate-800 hover:border-slate-600 text-[10px] sm:text-xs shadow-lg shadow-black/20 active:scale-95"
                                onClick={() => handleSubmit(null, true)}
                            >
                                {t('campaign.save_draft')}
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isReadOnly}
                            className={`flex-[3] py-4 px-10 rounded-2xl text-sm sm:text-base group font-black italic transition-all shadow-xl shadow-primary/20 ${isReadOnly ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'premium-btn text-white hover:shadow-primary/40 active:scale-[0.98]'}`}
                        >
                            <span className="uppercase tracking-[0.2em]">
                                {isReadOnly ? (formData.status === 'approved' ? t('campaign.status_approved_caps') : t('campaign.status_under_review_caps')) : (formData.status === 'rejected' ? t('campaign.resubmit_campaign_caps') : t('campaign.submit').toUpperCase())}
                            </span>
                            {!isReadOnly && <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform inline ml-2 mb-0.5" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5 relative">
                <div className="sticky top-24">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest pl-4">{t('campaign.live_preview') || 'Live Preview'}</h3>
                    <div className="max-w-full overflow-hidden rounded-3xl">
                        <AdPreview
                            formData={formData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignCreation;

