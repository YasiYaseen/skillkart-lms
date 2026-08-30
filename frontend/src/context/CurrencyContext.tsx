import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface CurrencyContextType {
  currency: string;
  symbol: string;
  formatAmount: (
    amount: number | null | undefined,
    options?: { showCode?: boolean; minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
  formatPrice: (
    price: number | null | undefined,
    options?: { freeLabel?: string; showCode?: boolean }
  ) => string;
  refreshSettings: () => Promise<void>;
}

const CURRENCY_STORAGE_KEY = 'skillkart_primary_currency';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  BRL: 'R$',
  SGD: 'S$',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'USD';
    } catch {
      return 'USD';
    }
  });

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.get<{ primaryCurrency?: string }>('/settings/public');
      if (res.data && res.data.primaryCurrency) {
        const newCurrency = res.data.primaryCurrency.toUpperCase();
        setCurrency(newCurrency);
        try {
          localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
        } catch {
          // ignore storage error
        }
      }
    } catch (err) {
      console.warn('Could not fetch public system currency settings:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  const formatAmount = useCallback(
    (
      amount: number | null | undefined,
      options?: { showCode?: boolean; minimumFractionDigits?: number; maximumFractionDigits?: number }
    ): string => {
      const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
      const minDigits = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2;
      const maxDigits = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;

      let formattedNumber: string;
      try {
        formattedNumber = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: minDigits,
          maximumFractionDigits: maxDigits,
        }).format(num);
      } catch {
        formattedNumber = num.toFixed(minDigits);
      }

      if (options?.showCode) {
        return `${symbol}${formattedNumber} ${currency}`;
      }

      return `${symbol}${formattedNumber}`;
    },
    [currency, symbol]
  );

  const formatPrice = useCallback(
    (
      price: number | null | undefined,
      options?: { freeLabel?: string; showCode?: boolean }
    ): string => {
      if (price === null || price === undefined || price === 0) {
        return options?.freeLabel || 'Free';
      }
      return formatAmount(price, options);
    },
    [formatAmount]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        formatAmount,
        formatPrice,
        refreshSettings,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
