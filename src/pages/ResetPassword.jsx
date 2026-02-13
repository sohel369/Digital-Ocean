import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Terminal, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { t } = useApp();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            toast.error("Invalid Request", { description: "Reset token is missing." });
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Mismatch", { description: "Passwords do not match." });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${window.VITE_API_URL || '/api'}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password })
            });

            if (response.ok) {
                setCompleted(true);
                toast.success("Success", { description: "Password updated successfully." });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                const err = await response.json();
                toast.error("Error", { description: err.error || "Failed to reset password." });
            }
        } catch (error) {
            toast.error("Network Error", { description: "Could not connect to server." });
        } finally {
            setLoading(false);
        }
    };

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050810] p-4">
                <div className="max-w-[440px] w-full bg-[#0a0f1d] p-10 rounded-[2.5rem] shadow-2xl border border-white/5 text-center">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 text-blue-500 mb-6 font-bold">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-4">Password Updated</h1>
                    <p className="text-slate-400 mb-8">Access restored. You are being redirected to the terminal login.</p>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050810] p-4">
            <div className="max-w-[440px] w-full bg-[#0a0f1d] p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 text-primary mb-6 border border-primary/10">
                        <Terminal size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Access Recovery</h1>
                    <p className="text-slate-500 text-sm font-medium">Set your new terminal access credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5 trasition-transform">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#111622] border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-slate-700"
                                placeholder="••••••••"
                                required minLength={8}
                            />
                            <Lock className="absolute right-5 top-4 text-slate-700" size={18} />
                        </div>
                    </div>

                    <div className="space-y-1.5 trasition-transform">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#111622] border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold text-sm placeholder:text-slate-700"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="absolute right-5 top-4 text-slate-700" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                    >
                        {loading ? "Updating Access..." : "Execute Password Reset"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
