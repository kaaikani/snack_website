'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocation } from '@remix-run/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  CURRENCY_DISPLAY_NAMES,
  getChannelTokenForCurrency,
  getStoredCurrency,
  setStoredCurrency,
  setStoredChannelToken,
  getCountriesForCurrency,
  setStoredCountry,
  getStoredCountry,
} from '~/utils/country-currency';
import { CurrencyCode } from '~/generated/graphql';

// Available currencies
const AVAILABLE_CURRENCIES = [
  CurrencyCode.Inr,
  CurrencyCode.Usd,
  // CurrencyCode.Eur,
] as const;

export function CountryCurrencyDropdown() {
  const location = useLocation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    getStoredCurrency() || 'INR',
  );
  const [showCountries, setShowCountries] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add scrollbar hiding styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;  /* Chrome, Safari and Opera */
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Initialize from localStorage on mount, set defaults if empty
  useEffect(() => {
    const storedCurrency = getStoredCurrency();

    // Initialize with INR if nothing is stored (default: Ind-Snacks)
    if (!storedCurrency) {
      setSelectedCurrency('INR');
      setStoredCurrency('INR');
      setStoredChannelToken('Ind-Snacks');
    } else {
      // Update channel based on stored currency (ensures cookie is set)
      const channelToken = getChannelTokenForCurrency(storedCurrency);
      setStoredChannelToken(channelToken);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCountries(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    setStoredCurrency(currency);

    // Update channel token based on currency (sets both localStorage and cookie)
    const channelToken = getChannelTokenForCurrency(currency);
    setStoredChannelToken(channelToken);

    // Show countries for the selected currency
    setShowCountries(true);
  };

  const handleCountryChange = (countryCode: string) => {
    setStoredCountry(countryCode);
    setIsOpen(false);
    setShowCountries(false);

    // Ensure cookie is set before navigation
    const currentCurrency = getStoredCurrency() || 'INR';
    const channelToken = getChannelTokenForCurrency(currentCurrency);
    setStoredChannelToken(channelToken);

    // Check if we're on the home page
    const isHomePage = location.pathname === '/';

    // Small delay to ensure cookie is set
    setTimeout(() => {
      if (isHomePage) {
        // If already on home page, just reload
        window.location.reload();
      } else {
        // If on non-home page, navigate to home to avoid errors
        window.location.href = '/';
      }
    }, 100);
  };

  const getCurrencyDisplayName = (code: string): string => {
    return CURRENCY_DISPLAY_NAMES[code] || code;
  };

  const currencyCountries = getCountriesForCurrency(selectedCurrency);
  const storedCountryCode = getStoredCountry();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setShowCountries(false);
          }
        }}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-100 hover:text-white transition-colors border border-amber-700/50 rounded-md hover:border-amber-600"
        aria-label="Select currency"
      >
        <span className="hidden sm:inline">
          {getCurrencyDisplayName(selectedCurrency)}
        </span>
        <span className="sm:hidden">{selectedCurrency}</span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-amber-950/95 backdrop-blur-lg border border-amber-800 rounded-lg shadow-xl z-50 overflow-hidden">
          {!showCountries ? (
            <div className="p-2">
              <label className="block text-xs font-semibold text-amber-200 mb-2 px-2">
                Currency
              </label>
              <div className="space-y-1">
                {AVAILABLE_CURRENCIES.map((currency) => (
                  <button
                    key={currency}
                    onClick={() => handleCurrencyChange(currency)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedCurrency === currency
                        ? 'bg-amber-800 text-white'
                        : 'text-amber-100 hover:bg-amber-900/50'
                    }`}
                  >
                    {getCurrencyDisplayName(currency)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <label className="block text-xs font-semibold text-amber-200">
                  Countries ({getCurrencyDisplayName(selectedCurrency)})
                </label>
                <button
                  onClick={() => setShowCountries(false)}
                  className="text-xs text-amber-300 hover:text-amber-100"
                >
                  ← Back
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
                {currencyCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountryChange(country.code)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      storedCountryCode === country.code
                        ? 'bg-amber-800 text-white'
                        : 'text-amber-100 hover:bg-amber-900/50'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
