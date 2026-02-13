import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

/**
 * PaymentCheckout Component
 * 
 * A reusable, Stripe-style payment form component.
 * Features:
 * - Clean, minimal inputs with floating visuals
 * - Card validation formatting (simulated)
 * - Secure badge and trust indicators
 * - Responsive layout
 * 
 * @param {Object} props
 * @param {number} props.amount - The total amount to pay
 * @param {string} props.currency - Currency symbol/code (default: '$')
 * @param {Function} props.onSuccess - Callback when payment is "processed"
 * @param {Function} props.onCancel - Callback to close/cancel
 */
export const PaymentCheckout = ({
    amount = 500,
    currency = 'USD',
    campaignId,
    onCancel
}) => {
    const { initiatePayment, formatCurrency, paymentConfig } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleStripeCheckout = async () => {
        if (!campaignId) {
            toast.error("Missing Campaign ID. Please create a campaign first.");
            return;
        }
        setIsProcessing(true);
        try {
            await initiatePayment(campaignId, currency);
        } catch (error) {
            console.error("Stripe Redirect Error:", error);
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden font-sans text-slate-200">
            {/* Sandbox Banner - STEP 8 */}
            {paymentConfig.isSandbox && (
                <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase text-center py-2 border-b border-amber-500/20 tracking-widest">
                    Stripe Test Mode (Sandbox)
                </div>
            )}

            {/* Header / Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Total Term Investment</h2>
                    <div className="text-4xl font-black text-white mt-1 tracking-tighter">
                        {formatCurrency(amount)}
                    </div>
                </div>
                <div className="relative z-10 h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <ShieldCheck size={28} />
                </div>
            </div>

            {/* Payment Body */}
            <div className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-200">Secure Stripe Integration</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">PCI-DSS Compliant Encryption</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-200">Instant Activation</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Live tracking within 24 hours</p>
                        </div>
                    </div>
                </div>

                {/* Info Text */}
                <p className="text-[10px] text-slate-500 leading-relaxed text-center font-medium uppercase tracking-widest px-4">
                    You will be redirected to Stripe's secure hosted payment page to finalize your payment and setup your billing method.
                </p>

                {/* Action Button */}
                <button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    className={`
                        w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-white shadow-2xl 
                        transition-all duration-300 italic group
                        ${isProcessing
                            ? 'bg-slate-800 cursor-not-allowed opacity-50'
                            : 'premium-btn hover:scale-[1.02] active:scale-95 shadow-primary/20'
                        }
                    `}
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Redirecting...</span>
                        </div>
                    ) : (
                        <>
                            <span>Proceed to Checkout</span>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                {/* Back Button */}
                <button
                    onClick={onCancel}
                    className="w-full text-center text-xs font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors py-2"
                >
                    Keep Editing Campaign
                </button>
            </div>
        </div>
    );
};

export const PaymentModal = ({ isOpen, onClose, amount, currency, campaignId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <PaymentCheckout
                    amount={amount}
                    currency={currency}
                    campaignId={campaignId}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
};

export default PaymentCheckout;