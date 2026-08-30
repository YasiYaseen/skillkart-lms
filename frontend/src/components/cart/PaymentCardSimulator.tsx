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
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Express 1-Click Fast Checkout</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Select your preferred digital wallet for instant authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            <button
              type="button"
              className="py-3 px-4 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span className="text-sm"></span>
              <span>Pay with Apple Pay</span>
            </button>

            <button
              type="button"
              className="py-3 px-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span className="font-bold text-blue-500">G</span>
              <span className="font-bold text-red-500">o</span>
              <span className="font-bold text-amber-500">o</span>
              <span className="font-bold text-green-500">g</span>
              <span className="font-bold text-blue-500">l</span>
              <span className="font-bold text-red-500">e</span>
              <span>Pay</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-mono text-xs text-emerald-700 dark:text-emerald-300 font-bold max-w-md mx-auto">
            ✓ Express Token Pre-Authorized for ${totalAmount.toFixed(2)} USD
          </div>
        </div>
      )}

      {/* PAYPAL VIEW */}
      {formState.method === 'paypal' && (
        <div className="p-6 rounded-2xl bg-[#003087]/5 dark:bg-[#003087]/15 border border-[#003087]/20 text-center space-y-4">
          <div className="space-y-1">
            <div className="text-3xl">🅿️</div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Pay with PayPal</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Safe, fast checkout with your PayPal balance or linked bank accounts.
            </p>
          </div>

          <div className="max-w-xs mx-auto pt-2 space-y-2">
            <button
              type="button"
              className="w-full py-3 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="italic font-black text-base">PayPal</span>
              <span>Checkout</span>
            </button>
            <button
              type="button"
              className="w-full py-2.5 bg-[#2C2E2F] hover:bg-[#1f2021] text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
            >
              Pay Later (4 interest-free payments)
            </button>
          </div>
        </div>
      )}

      {/* UPI / QR VIEW */}
      {formState.method === 'upi' && (
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="text-center space-y-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Instant UPI & Net Banking</h4>
            <p className="text-xs text-gray-500">
              Scan the QR code from your phone or enter your UPI ID.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
            {/* Interactive QR Mockup */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-md text-center space-y-2">
              <div className="w-32 h-32 bg-gray-900 rounded-xl p-2 flex items-center justify-center mx-auto text-white font-mono text-[10px] grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      i % 3 === 0 || i === 0 || i === 3 || i === 12 || i === 15
                        ? 'bg-white'
                        : 'bg-indigo-400 opacity-80'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-600 block">Scan to Pay ${totalAmount.toFixed(2)}</span>
            </div>

            {/* UPI ID input & app icons */}
            <div className="space-y-3 flex-1 max-w-xs text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Or enter UPI Virtual ID
                </label>
                <input
                  type="text"
                  placeholder="username@okhdfcbank"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 justify-center pt-1 text-[11px] text-gray-500">
                <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold">GPay</span>
                <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold">PhonePe</span>
                <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold">Paytm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
