import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UploadCloud, DollarSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdPreview from '../components/AdPreview';

const CampaignCreation = () => {
    const navigate = useNavigate();
    const { addCampaign } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        budget: '',
        startDate: '',
        endDate: '',
        headline: '',
        description: '',
        cta: 'Learn More',
        image: null
    });


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
        try {
            await addCampaign({
                name: formData.name,
                budget: parseFloat(formData.budget),
                startDate: formData.startDate,
                status: 'review',
                ad_format: formData.format || 'display',
                headline: formData.headline,
                description: formData.description
            });
            navigate('/');
        } catch (error) {
            console.error("Submission failed:", error);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">

            {/* Form Section */}
            <div className="lg:col-span-7 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Create New Campaign</h1>
                    <p className="text-slate-400 mt-1">Fill in the details to launch your ad.</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 shadow-sm space-y-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-700/50 pb-2">Campaign Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Campaign Name</label>
                            <input
                                type="text" name="name" required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-500"
                                placeholder="e.g. Summer Sale 2024"
                                value={formData.name} onChange={handleInputChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Total Budget</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="number" name="budget" required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-500"
                                        placeholder="5000"
                                        value={formData.budget} onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                                <input
                                    type="date" name="startDate" required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all [color-scheme:dark]"
                                    value={formData.startDate} onChange={handleInputChange}
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Creative Assets */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-700/50 pb-2 pt-4">Ad Creative</h3>

                        {/* File Upload */}
                        <div
                            className="border-2 border-dashed border-slate-700/50 bg-slate-800/30 rounded-2xl p-8 text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                        >
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileDrop} accept="image/*" />
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-primary/10 text-primary-light rounded-full flex items-center justify-center mb-3">
                                    <UploadCloud size={24} />
                                </div>
                                <p className="text-sm font-medium text-slate-300">Click or drag image to upload</p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF up to 10MB</p>
                            </div>
                        </div>

                        {formData.image && (
                            <div className="relative inline-block mt-4">
                                <img src={formData.image} alt="Preview" className="h-20 w-auto rounded-lg border border-slate-200" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, image: null }))}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Headline</label>
                            <input
                                type="text" name="headline" maxLength={50}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-500"
                                placeholder="Catchy headline (max 50 chars)"
                                value={formData.headline} onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea
                                name="description" rows={3} maxLength={150}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none placeholder:text-slate-500"
                                placeholder="Ad body text (max 150 chars)"
                                value={formData.description} onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Ad Format</label>
                            <select
                                name="format"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                value={formData.format || ''}
                                onChange={handleInputChange}
                            >
                                <option value="">Responsive (Auto)</option>
                                <option value="Leaderboard">Leaderboard (728x90)</option>
                                <option value="Medium Rectangle">Medium Rectangle (300x250)</option>
                                <option value="Mobile Banner">Mobile Banner (320x50)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Call to Action</label>
                            <select
                                name="cta"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                value={formData.cta} onChange={handleInputChange}
                            >
                                <option>Learn More</option>
                                <option>Shop Now</option>
                                <option>Sign Up</option>
                                <option>Book Now</option>
                                <option>Contact Us</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button type="button" className="flex-1 py-3 px-4 border border-slate-700 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-colors" onClick={() => navigate('/')}>Cancel</button>
                        <button type="submit" className="flex-1 py-3 px-4 premium-btn rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]">Launch Campaign</button>
                    </div>
                </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5 relative">
                <div className="sticky top-24">
                    <AdPreview
                        headline={formData.headline}
                        description={formData.description}
                        ctaText={formData.cta}
                        image={formData.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
                        format={formData.format}
                    />
                </div>
            </div>
        </div>
    );
};

export default CampaignCreation;
