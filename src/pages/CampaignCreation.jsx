import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UploadCloud, DollarSign, X, MapPin, Globe, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdPreview from '../components/AdPreview';

const CampaignCreation = () => {
    const navigate = useNavigate();
    const { addCampaign, pricingData, country, t, adFormats, ctaOptions, formatIndustryName } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        budget: '150',
        startDate: '',
        endDate: '',
        headline: '',
        description: '',
        cta: 'Learn More',
        landingPageUrl: '',
        industry: pricingData.industries[0]?.name || '',
        coverageArea: 'radius',
        targetState: pricingData.states.find(s => s.countryCode === country)?.name || (pricingData.states[0]?.name || ''),
        postcode: '',
        format: adFormats[0]?.id || 'mobile_leaderboard',
        image: null
    });

    const filteredStates = pricingData.states.filter(s => s.countryCode === country);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileDrop = (e) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            alert(t('campaign.validation_error'));
            return;
        }

        const config = {
            name: formData.name,
            budget: parseFloat(formData.budget),
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: 'review',
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
                cta: formData.cta
            }
        };

        try {
            await addCampaign(config);
            navigate('/');
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
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                    placeholder={t('campaign.name_placeholder')}
                                    value={formData.name} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.industry')}</label>
                                <div className="relative group">
                                    <select
                                        name="industry"
                                        className="w-full bg-slate-900/10 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer pr-10"
                                        value={formData.industry} onChange={handleInputChange}
                                    >
                                        {pricingData.industries.map(i => (
                                            <option key={i.name} value={i.name} className="bg-slate-900 text-sm">
                                                {t(`industry.${i.name.toLowerCase().replace(/ /g, '_')}`) || i.displayName || formatIndustryName(i.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.start_date')}</label>
                                <input
                                    type="date" name="startDate" required
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                                    value={formData.startDate} onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.end_date')}</label>
                                <input
                                    type="date" name="endDate" required
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                                    value={formData.endDate} onChange={handleInputChange}
                                />
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
                                    onClick={() => setFormData(p => ({ ...p, coverageArea: opt.id }))}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] sm:text-sm font-bold transition-all border-2 ${formData.coverageArea === opt.id
                                        ? 'bg-primary/10 border-primary text-primary-light shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    <opt.icon size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {formData.coverageArea === 'radius' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.postcode')}</label>
                                <input
                                    type="text" name="postcode"
                                    className="w-full md:w-64 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600"
                                    placeholder={t('campaign.postcode_placeholder')}
                                    value={formData.postcode} onChange={handleInputChange}
                                />
                            </div>
                        )}

                        {formData.coverageArea === 'state' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.select_region')}</label>
                                <select
                                    name="targetState"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.targetState} onChange={handleInputChange}
                                >
                                    {filteredStates.length > 0 ? (
                                        filteredStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)
                                    ) : (
                                        <option value="">{t('common.no_data')}</option>
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
                            className="border-2 border-dashed border-slate-700/50 bg-slate-900/30 rounded-3xl p-10 text-center hover:bg-slate-900/50 transition-all cursor-pointer relative group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                        >
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileDrop} accept="image/*" />
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 bg-primary/10 text-primary-light rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <UploadCloud size={28} />
                                </div>
                                <p className="text-sm font-bold text-slate-200 uppercase tracking-wide">{t('campaign.click_to_upload')}</p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">{t('campaign.optimal_size')}</p>
                            </div>
                        </div>

                        {formData.image && (
                            <div className="relative inline-block mt-4 animate-in zoom-in-95">
                                <img src={formData.image} alt={t('campaign.live_preview')} className="h-24 w-auto rounded-2xl border border-white/10 shadow-2xl" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, image: null }))}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.headline')}</label>
                                <input
                                    type="text" name="headline" maxLength={50}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600"
                                    placeholder={t('campaign.headline_placeholder')}
                                    value={formData.headline} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.description')}</label>
                                <textarea
                                    name="description" rows={3} maxLength={150}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-slate-600"
                                    placeholder={t('campaign.description_placeholder')}
                                    value={formData.description} onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.landing_page')}</label>
                                <input
                                    type="url" name="landingPageUrl"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600"
                                    placeholder="https://example.com"
                                    value={formData.landingPageUrl} onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('campaign.format')}</label>
                                <div className="relative group">
                                    <select
                                        name="format"
                                        className="w-full bg-slate-900/10 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer pr-10"
                                        value={formData.format}
                                        onChange={handleInputChange}
                                    >
                                        {adFormats.map(a => (
                                            <option key={a.id} value={a.id} className="bg-slate-900 text-sm">
                                                {t(`formats.${a.id}`) || a.name}
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
                                <select
                                    name="cta"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.cta} onChange={handleInputChange}
                                >
                                    {ctaOptions.map(o => (
                                        <option key={o} value={o} className="bg-slate-900">
                                            {t(`campaign.${o}`) || o}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="glass-panel rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">4. {t('campaign.budget_pricing')}</h3>
                            <div className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                                {t('campaign.pay_as_you_go')}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase">{t('campaign.daily_budget')}</label>
                            <div className="relative max-w-xs">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl italic">$</div>
                                <input
                                    type="number" name="budget" step="10" min="50"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-4 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.budget} onChange={handleInputChange}
                                />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{t('campaign.budget_min')}</p>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button type="button" className="flex-1 py-4 border border-slate-800 rounded-2xl text-slate-400 font-bold uppercase transition-all hover:bg-slate-800/50" onClick={() => navigate('/')}>{t('common.discard') || 'Discard'}</button>
                        <button type="submit" className="flex-[2] premium-btn py-4 rounded-2xl text-lg group font-black italic">
                            {t('campaign.submit').toUpperCase()}
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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

