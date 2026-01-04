import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
    const { login, signup } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
