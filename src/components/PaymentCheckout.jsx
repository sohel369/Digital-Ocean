import React, { useState } from 'react';

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
    currency = '$',
    onSuccess,
    onCancel
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    // Simulate processing
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        // Fake API delay
        setTimeout(() => {
            setIsProcessing(false);
            if (onSuccess) onSuccess();
        }, 2000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Simple mock formatting would go here in a real app
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200">

            {/* Header / Summary */}
            <div className="bg-slate-800/50 p-6 border-b border-slate-700/50 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total due</h2>
                    <div className="text-3xl font-bold text-white mt-1">{currency}{amount}</div>
                </div>
                <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Card Number */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 ml-1">Card information</label>
                    <div className="relative group">
                        <input
                            type="text"
                            name="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 pl-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            required
                            onChange={handleInputChange}
                        />
                        <svg className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                    </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Expiry Date</label>
                        <input
                            type="text"
                            name="expiry"
                            placeholder="MM / YY"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            required
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 ml-1">CVC</label>
                        <div className="relative group">
                            <input
                                type="text"
                                name="cvc"
                                placeholder="123"
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 pr-10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                required
                                onChange={handleInputChange}
                            />
                            <svg className="absolute right-3 top-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Cardholder Name */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 ml-1">Cardholder Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name on Card"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        required
                        onChange={handleInputChange}
                    />
                </div>

                {/* Action Button */}
                <button
                    type="submit"
                    disabled={isProcessing}
                    className={`
            w-full flex items-center justify-center py-4 rounded-xl font-bold text-white shadow-lg 
            transition-all duration-200 mt-2
            ${isProcessing
                            ? 'bg-slate-700 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-indigo-500/20'
                        }
          `}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            Pay {currency}{amount}
                        </span>
                    )}
                </button>

                {/* Trust Footer */}
                <div className="text-center space-y-3 pt-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 py-1.5 px-3 rounded-full inline-flex mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        SSL Secure Payment
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-[90%] mx-auto">
                        Instant receipt and downloadable tax invoice will be provided immediately after payment.
                    </p>
                </div>

            </form>
        </div>
    );
};

/**
 * PaymentModal Container
 * Wrapper to display the Checkout in a modal overlay
 */
export const PaymentModal = ({ isOpen, onClose, amount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <PaymentCheckout
                    amount={amount}
                    onCancel={onClose}
                    onSuccess={() => {
                        alert('Payment Successful! (Mock)');
                        onClose();
                    }}
                />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors p-2"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default PaymentCheckout;
