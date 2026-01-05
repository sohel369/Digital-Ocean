import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

import { signInWithGoogle } from '../firebase';

const Login = () => {
    const { login, signup, googleAuth } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const googleUser = await signInWithGoogle();
            const result = await googleAuth(googleUser);
            if (result.success) {
                toast.success('Authorized via Google', { description: `Welcome back, ${result.user.username}` });
                navigate('/');
            } else {
                toast.error('Auth Sync Failed', { description: result.message });
            }
        } catch (error) {
            console.error('Google Auth Error:', error);
            toast.error('Google Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const result = await login(username, password);
                if (result.success) {
                    toast.success('Access Granted', { description: `Authorized as ${result.user.username}` });
                    navigate('/');
                } else {
                    toast.error('Authentication Error', { description: result.message });
                }
            } else {
                const result = await signup(username, email, password);
                if (result.success) {
                    toast.success('Account Created', { description: 'You can now log in with your credentials.' });
                    setIsLogin(true);
                } else {
                    toast.error('Registration Error', { description: result.message });
                }
            }
        } catch (error) {
            console.error('Auth Error:', error);
            toast.error('System Error', { description: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-['Inter']">
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500 border border-white/5">
                <div className="text-center mb-10">
                    <div className="inline-block p-3 rounded-2xl bg-primary/10 text-primary-light mb-4">
                        <Terminal size={32} />
                    </div>
                    <h1 className="text-3xl font-bold premium-text mb-2">{isLogin ? 'Identity Verification' : 'System Registration'}</h1>
                    <p className="text-slate-400 text-sm">{isLogin ? 'AdPlatform Premium Terminal Access' : 'Create a new operator account'}</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-slate-700/50"></div>
                        <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-slate-500">Or use credentials</span>
                        <div className="flex-grow border-t border-slate-700/50"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono text-sm"
                            placeholder="OPERATOR_ID"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono text-sm"
                                placeholder="operator@adplatform.net"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 mt-2"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Execute Login' : 'Register Operator')}
                    </button>
                </form>

                <div className="mt-8 text-center bg-slate-900/30 p-4 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-slate-400 hover:text-primary-light transition-colors"
                    >
                        {isLogin ? "Need a new account? Register here" : "Already have an account? Sign in"}
                    </button>
                </div>

                {isLogin && (
                    <div className="mt-6 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-2">Emergency Credentials</p>
                        <code className="text-[10px] text-primary-light/60 bg-primary/5 px-2 py-1 rounded">ADMIN / ADMIN123</code>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
