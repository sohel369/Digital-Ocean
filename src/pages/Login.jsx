import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Dropdown from '../components/Dropdown';
import { Terminal, Briefcase, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { signInWithGoogle, getRedirectResult, auth } from '../firebase';
import { SUPPORTED_INDUSTRIES } from '../config/industries';
import { SUPPORTED_COUNTRIES } from '../config/i18nConfig';

const Login = () => {
    const { login, signup, googleAuth, resetPassword, user, t } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [industry, setIndustry] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Prepare options for Dropdown
    const industryOptions = SUPPORTED_INDUSTRIES.map(ind => ({
        value: ind,
        name: ind
    }));

    const countryOptions = SUPPORTED_COUNTRIES.map(c => ({
        value: c.name,
        name: c.name
    }));

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);
    // Handle Google sign-in redirect result (for Railway COOP issues)
    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    // User signed in via redirect
                    googleAuth(result.user)
                        .then((res) => {
                            if (res.success && res.user) {
                                toast.success(t('common.success'), {
                                    description: `Welcome back, ${res.user.username || res.user.email || 'User'}`
                                });
                                navigate('/');
                            } else {
                                toast.error(t('common.error'), { description: res.message });
                            }
                        })
                        .catch((e) => {
                            console.error('Google Redirect Auth Error:', e);
                            toast.error(t('common.error'));
                        });
                }
            })
            .catch((error) => {
                console.error('Redirect result error:', error);
            });
    }, []);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const googleUser = await signInWithGoogle();
            const result = await googleAuth(googleUser);
            if (result.success && result.user) {
                toast.success(t('common.success'), {
                    description: `Welcome back, ${result.user.username || result.user.email || 'User'}`
                });
                navigate('/');
            } else if (!result.success) {
                toast.error(t('common.error'), { description: result.message });
            }
        } catch (error) {
            console.error('Google Auth Error:', error);
            if (error.code !== 'auth/popup-blocked' && !error.message.includes('COOP')) {
                toast.error(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isForgot) {
                if (!email.includes('@')) {
                    toast.error(t('common.error'), {
                        description: t('auth.email_required_msg') || 'Please use your registered Email Address.'
                    });
                    setLoading(false);
                    return;
                }
                const result = await resetPassword(email);
                if (result.success) {
                    toast.success("Reset Link Sent", {
                        description: "Check your email for the password reset link."
                    });
                    setIsForgot(false);
                } else {
                    toast.error("Error", { description: result.message });
                }
                setLoading(false);
                return;
            }

            if (isLogin) {
                if (!email.includes('@') && email.toUpperCase() !== 'ADMIN') {
                    toast.error(t('common.error'), {
                        description: t('auth.email_required_msg') || 'Please use your registered Email Address.'
                    });
                    setLoading(false);
                    return;
                }

                const result = await login(email, password);
                if (result.success && result.user) {
                    toast.success(t('common.success'), {
                        description: `Authorized as ${result.user.username || result.user.email || 'User'}`
                    });

                    // Explicitly redirect admins to admin dashboard, else to user dashboard
                    if (result.user.role === 'admin' || result.user.role === 'ADMIN') {
                        navigate('/admin/campaigns');
                    } else {
                        navigate('/');
                    }
                } else if (!result.success) {
                    toast.error(t('common.error'), { description: result.message || 'Invalid credentials provided.' });
                }
            } else {
                if (!industry || !selectedCountry) {
                    toast.error(t('common.error'), {
                        description: 'Please select both Industry and Country to continue.'
                    });
                    setLoading(false);
                    return;
                }

                // Ensure arguments match: username, email, password, { extraData }
                const result = await signup(username, email, password, {
                    industry: industry,
                    country: selectedCountry
                });
                if (result.success) {
                    toast.success(t('common.success'), { description: 'Welcome to the platform!' });

                    // Redirect after signup - if they are admin, send to admin control
                    if (result.user?.role === 'admin' || result.user?.role === 'ADMIN') {
                        navigate('/admin/campaigns');
                    } else {
                        navigate('/');
                    }
                } else {
                    toast.error(t('common.error'), { description: result.message || 'Failed to create account.' });
                }
            }
        } catch (error) {
            console.error('Auth Error:', error);
            const errorMsg = error.message?.replace('Firebase: ', '') || 'An unexpected error occurred.';
            toast.error(t('common.error'), { description: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050810] p-4">
            <div className="max-w-[440px] w-full bg-[#0a0f1d] p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/5 text-blue-500 mb-6 border border-blue-500/10">
                        <Terminal size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{t('auth.title')}</h1>
                    <p className="text-slate-500 text-sm font-medium">{t('auth.subtitle')}</p>
                </div>

                <div className="space-y-6">
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-800/60"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{t('auth.or_divider')}</span>
                        <div className="flex-grow border-t border-slate-800/60"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-1.5 focus-within:transform focus-within:translate-x-1 transition-transform">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">
                            {isLogin ? (isForgot ? t('auth.email_label') : t('auth.email_label')) : t('auth.username_label')}
                        </label>
                        <input
                            type="text"
                            value={isLogin && isForgot ? email : (isLogin ? email : username)}
                            onChange={(e) => isLogin ? setEmail(e.target.value) : setUsername(e.target.value)}
                            className="w-full bg-[#111622] border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-slate-700"
                            placeholder={isLogin ? (isForgot ? "Enter your registered email" : "admin@adplatform.com") : "NEW_OPERATOR_01"}
                            required autoComplete="off"
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">{t('auth.email_label')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#111622] border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-slate-700"
                                    placeholder="operator@adplatform.com"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5 animate-in slide-in-from-top-3">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Industry</label>
                                <Dropdown
                                    options={industryOptions}
                                    value={industry}
                                    onChange={setIndustry}
                                    label="Select Industry"
                                    icon={<Briefcase size={16} className="text-primary" />}
                                    menuWidth="w-full"
                                    align="left"
                                />
                            </div>

                            <div className="space-y-1.5 animate-in slide-in-from-top-3">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Country</label>
                                <Dropdown
                                    options={countryOptions}
                                    value={selectedCountry}
                                    onChange={setSelectedCountry}
                                    label="Select Country"
                                    icon={<Globe size={16} className="text-secondary" />}
                                    menuWidth="w-full"
                                    align="left"
                                />
                                {!selectedCountry && <p className="text-[10px] text-red-400 font-medium pl-1">Country selection is required</p>}
                            </div>
                        </>
                    )}

                    {!isForgot && (
                        <div className="space-y-1.5 focus-within:transform focus-within:translate-x-1 transition-transform">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">{t('auth.password_label')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#111622] border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-slate-700"
                                placeholder="••••••••"
                                required={!isForgot}
                            />
                        </div>
                    )}

                    {isLogin && !isForgot && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setIsForgot(true)} className="text-[11px] font-bold text-slate-500 hover:text-blue-500 transition-colors uppercase tracking-wider">
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#2563eb] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                    >
                        {loading ? t('auth.processing') : (isForgot ? "Send Reset Link" : (isLogin ? t('auth.login_btn') : t('auth.register_btn')))}
                    </button>
                </form>

                <div className="mt-8">
                    <button
                        onClick={() => {
                            if (isForgot) setIsForgot(false);
                            else setIsLogin(!isLogin);
                        }}
                        className="w-full bg-[#111622] hover:bg-[#111622]/80 border border-slate-800/80 py-4 rounded-2xl text-xs font-semibold text-slate-400 transition-all"
                    >
                        {isForgot ? "Back to Login" : (isLogin ? t('auth.need_account') : t('auth.have_account'))}
                    </button>
                </div>


            </div>
        </div>
    );
};

export default Login;
