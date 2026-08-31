import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  CreditCardIcon,
  BoltIcon,
  BuildingLibraryIcon,
  LockClosedIcon,
  CheckIcon,
} from '@heroicons/react/20/solid';

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
  const { formatAmount } = useCurrency();

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
      cardNumber: '4242 4242 4242 4242',
      cardHolder: 'JANE DOE',
      expiry: '12/28',
      cvv: '888',
    });
  };

  const maskedCardNumber = formState.cardNumber
    ? formState.cardNumber.padEnd(19, '•')
    : '•••• •••• •••• ••••';

  return (
    <div className="space-y-6">
      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onChange({ method: 'card' })}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            formState.method === 'card'
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <CreditCardIcon className="w-5 h-5 mb-1 text-slate-500" />
          <span>Credit / Debit</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'express' })}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            formState.method === 'express'
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <BoltIcon className="w-5 h-5 mb-1 text-slate-500" />
          <span>FastPay</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'paypal' })}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            formState.method === 'paypal'
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-black italic mb-1 text-slate-700 dark:text-slate-300">PP</span>
          <span>PayPal</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ method: 'upi' })}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            formState.method === 'upi'
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <BuildingLibraryIcon className="w-5 h-5 mb-1 text-slate-500" />
          <span>NetBank / UPI</span>
        </button>
      </div>

      {/* CARD METHOD INTERACTIVE VIEW */}
      {formState.method === 'card' && (
        <div className="space-y-5">
          {/* Visual Credit Card Preview */}
          <div className="relative mx-auto max-w-sm w-full h-44 rounded-xl p-5 text-white bg-slate-900 shadow-md overflow-hidden flex flex-col justify-between border border-slate-700">
            {/* Top row: Chip & Network */}
            <div className="flex items-center justify-between z-10">
              <div className="w-10 h-7 rounded-sm bg-slate-700 border border-slate-600 flex items-center justify-center">
                <div className="w-7 h-4 border border-slate-500/60 rounded-xs grid grid-cols-2 gap-0.5 opacity-60"></div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold tracking-wider">
                <span>SKILLKART</span>
              </div>
            </div>

            {/* Middle: Live Card Number */}
            <div className="z-10 tracking-widest font-mono text-base font-semibold text-slate-100">
              {maskedCardNumber}
            </div>

            {/* Bottom: Cardholder & Expiry */}
            <div className="flex items-end justify-between text-xs z-10 uppercase tracking-wider text-slate-300">
              <div>
                <div className="text-[9px] text-slate-400 font-medium tracking-normal">Cardholder</div>
                <div className="font-semibold truncate max-w-[170px]">
                  {formState.cardHolder || 'YOUR NAME HERE'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 font-medium tracking-normal">Expires</div>
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
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
            >
              <BoltIcon className="w-3.5 h-3.5" />
              <span>Fill test credentials</span>
            </button>
          </div>

          {/* Card Inputs Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={formState.cardNumber}
                  onChange={(e) => onChange({ cardNumber: formatCardNumber(e.target.value) })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <LockClosedIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formState.cardHolder}
                onChange={(e) => onChange({ cardHolder: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiration (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="12/28"
                value={formState.expiry}
                onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Security Code (CVV)
                </label>
                <span className="text-[10px] text-slate-400">3 digits on back</span>
              </div>
              <input
                type="password"
                maxLength={4}
                placeholder="888"
                value={formState.cvv}
                onChange={(e) => onChange({ cvv: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK FAST PAY VIEW */}
      {formState.method === 'express' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Express Checkout</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Select your digital wallet for rapid authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto pt-1">
            <button
              type="button"
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apple Pay</span>
            </button>

            <button
              type="button"
              className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Google Pay</span>
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium max-w-md mx-auto flex items-center justify-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-emerald-600" />
            <span>Pre-authorized for {formatAmount(totalAmount, { showCode: true })}</span>
          </div>
        </div>
      )}

      {/* PAYPAL VIEW */}
      {formState.method === 'paypal' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Pay with PayPal</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Safe, fast checkout with your PayPal balance or linked bank accounts.
            </p>
          </div>

          <div className="max-w-xs mx-auto pt-1 space-y-2">
            <button
              type="button"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Continue to PayPal
            </button>
          </div>
        </div>
      )}

      {/* UPI / QR VIEW */}
      {formState.method === 'upi' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-center space-y-1">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">UPI & Net Banking</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your UPI Virtual Payment Address (VPA) or scan QR.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-1">
            <div className="space-y-2.5 flex-1 max-w-xs text-xs w-full">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI Virtual ID
                </label>
                <input
                  type="text"
                  placeholder="username@bank"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 justify-center pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-medium">GPay</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-medium">PhonePe</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-medium">Paytm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
