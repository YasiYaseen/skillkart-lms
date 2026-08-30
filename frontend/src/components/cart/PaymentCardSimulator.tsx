import React, { useState } from 'react';

export interface PaymentFormState {
  method: 'card' | 'express' | 'paypal' | 'upi';
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  saveCard: boolean;
}

interface PaymentCardSimulatorProps {
  formState: PaymentFormState;
  onChange: (updates: Partial<PaymentFormState>) => void;
  totalAmount: number;
}

export function PaymentCardSimulator({ formState, onChange, totalAmount }: PaymentCardSimulatorProps) {
  const [cvvFocused, setCvvFocused] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  const handleAutoFillDemo = () => {
    onChange({
      method: 'card',
      cardNumber: '4242 4242 4242 4242',
      cardHolder: 'ALEX R. LEARNER',
      expiry: '12/28',
      cvv: '888',
      saveCard: true,
    });
  };

  const maskedCardNumber = formState.cardNumber
    ? formState.cardNumber.padEnd(19, '•')
    : '•••• •••• •••• ••••';

  return (
    <div className="space-y-6">
      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => onChange({ method: 'card' })}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            formState.method === 'card'
              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <span className="text-xl mb-1">💳</span>
          <span>Credit / Debit</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'express' })}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            formState.method === 'express'
              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <span className="text-xl mb-1">⚡</span>
          <span>1-Click FastPay</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'paypal' })}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            formState.method === 'paypal'
              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <span className="text-xl mb-1">🅿️</span>
          <span>PayPal</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'upi' })}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            formState.method === 'upi'
              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <span className="text-xl mb-1">🏦</span>
          <span>NetBank / UPI</span>
        </button>
      </div>

      {/* CARD METHOD INTERACTIVE VIEW */}
      {formState.method === 'card' && (
        <div className="space-y-6">
          {/* Visual Realistic Credit Card */}
          <div className="relative mx-auto max-w-sm w-full h-48 rounded-3xl p-6 text-white bg-linear-to-tr from-indigo-900 via-indigo-700 to-purple-800 shadow-2xl overflow-hidden flex flex-col justify-between border border-white/20 transition-transform duration-300 hover:scale-[1.02]">
            {/* Holographic background wave */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-purple-500/20 rounded-full blur-lg pointer-events-none"></div>

            {/* Top row: Chip & Network */}
            <div className="flex items-center justify-between z-10">
              <div className="w-11 h-8 rounded-lg bg-linear-to-br from-amber-200 to-amber-400 border border-amber-300/80 shadow-xs flex items-center justify-center">
                <div className="w-8 h-5 border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60"></div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold tracking-widest text-indigo-200">SKILLKART PAY</span>
                <span className="text-lg">💳</span>
              </div>
            </div>

            {/* Middle: Live Card Number */}
            <div className="z-10 tracking-widest font-mono text-base sm:text-lg font-bold text-shadow-sm">
              {maskedCardNumber}
            </div>

            {/* Bottom: Cardholder & Expiry */}
            <div className="flex items-end justify-between text-xs z-10 uppercase tracking-wider">
              <div>
                <div className="text-[9px] text-indigo-200 font-medium tracking-normal">Cardholder</div>
                <div className="font-semibold truncate max-w-[170px]">
                  {formState.cardHolder || 'YOUR NAME HERE'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-indigo-200 font-medium tracking-normal">Expires</div>
                <div className="font-mono font-semibold">
                  {formState.expiry || 'MM/YY'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Auto-Fill Demo Card Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs"
            >
              <span>⚡ Click to Auto-fill Demo Test Card (Zero friction)</span>
            </button>
          </div>

          {/* Card Inputs Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={formState.cardNumber}
                  onChange={(e) => onChange({ cardNumber: formatCardNumber(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-base">🔒</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formState.cardHolder}
                onChange={(e) => onChange({ cardHolder: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Expiration (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="12/28"
                value={formState.expiry}
                onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Security Code (CVV)
                </label>
                <span className="text-[10px] text-gray-400">3 digits on back</span>
              </div>
              <input
                type="password"
                maxLength={4}
                placeholder="888"
                value={formState.cvv}
                onFocus={() => setCvvFocused(true)}
                onBlur={() => setCvvFocused(false)}
                onChange={(e) => onChange({ cvv: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK FAST PAY VIEW */}
      {formState.method === 'express' && (
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-2xl mx-auto">
            ⚡
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">1-Click Express Checkout</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Skip filling billing info. Seamlessly authorize this test order with one click.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono text-xs text-emerald-600 font-bold">
            ✓ Express Token Pre-Authorized for ${totalAmount.toFixed(2)} USD
          </div>
        </div>
      )}

      {/* PAYPAL VIEW */}
      {formState.method === 'paypal' && (
        <div className="p-6 rounded-2xl bg-[#003087]/5 dark:bg-[#003087]/15 border border-[#003087]/20 text-center space-y-3">
          <div className="text-3xl">🅿️</div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white">Pay with PayPal</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You will be redirected to PayPal's simulated authorization portal upon completing checkout.
          </p>
        </div>
      )}

      {/* UPI VIEW */}
      {formState.method === 'upi' && (
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center space-y-3">
          <div className="text-3xl">🏦</div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white">Instant UPI / QR Code</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Scan and pay from any supported UPI app (Google Pay, PhonePe, Paytm, or Net Banking).
          </p>
        </div>
      )}
    </div>
  );
}
