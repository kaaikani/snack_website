// Currency to Channel mapping
export const CURRENCY_CHANNEL_MAP: Record<string, string> = {
  INR: 'Ind-Snacks',
  USD: 'usd-snacks',
  //   EUR: 'eur-snacks',
};

// Country to default channel mapping (for India only)
export const COUNTRY_CHANNEL_MAP: Record<string, string> = {
  India: 'ind-snacks',
};

// Country list
export const COUNTRIES = [
  'India',
  'Singapore',
  'Malaysia',
  'Sri Lanka',
  'Australia',
  'Canada',
  'UK',
  'USA',
] as const;

// Currency display names
export const CURRENCY_DISPLAY_NAMES: Record<string, string> = {
  USD: 'USD',
  //   EUR: 'EUR',
  INR: 'INR',
};

// Get channel token for a country (India only has one channel)
export function getChannelTokenForCountry(country: string): string {
  return COUNTRY_CHANNEL_MAP[country] || 'usd-snacks';
}

// Get channel token for a currency
export function getChannelTokenForCurrency(currency: string): string {
  return CURRENCY_CHANNEL_MAP[currency] || 'Ind-Snacks';
}

// Get default currency for a country
export function getDefaultCurrencyForCountry(country: string): string {
  if (country === 'India') {
    return 'INR';
  }
  return 'USD';
}

// Storage keys
const STORAGE_KEY_COUNTRY = 'selected-country';
const STORAGE_KEY_CURRENCY = 'selected-currency';
const STORAGE_KEY_CHANNEL = 'selected-channel';

// Get stored country
export function getStoredCountry(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_COUNTRY);
}

// Set stored country (accepts country code like 'IN', 'US', etc.)
export function setStoredCountry(countryCode: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_COUNTRY, countryCode);
  // Find country name from STATIC_COUNTRIES
  const country = STATIC_COUNTRIES.find((c) => c.code === countryCode);
  if (country) {
    // For India, use ind-snacks, otherwise use currency-based channel
    if (country.name === 'India') {
      const channelToken = getChannelTokenForCountry(country.name);
      localStorage.setItem(STORAGE_KEY_CHANNEL, channelToken);
    } else {
      // For other countries, use currency to determine channel
      const currency = getStoredCurrency() || 'USD';
      const channelToken = getChannelTokenForCurrency(currency);
      localStorage.setItem(STORAGE_KEY_CHANNEL, channelToken);
    }
  }
}

// Get stored currency
export function getStoredCurrency(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_CURRENCY);
}

// Set stored currency
export function setStoredCurrency(currency: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
  // Update channel token based on currency
  const channelToken = getChannelTokenForCurrency(currency);
  setStoredChannelToken(channelToken);
}

// Get stored channel token
export function getStoredChannelToken(): string {
  if (typeof window === 'undefined') return 'Ind-Snacks';

  // Initialize defaults if nothing is stored
  const storedCurrency = getStoredCurrency();
  const storedChannel = localStorage.getItem(STORAGE_KEY_CHANNEL);

  // If nothing is stored, initialize with INR defaults (Ind-Snacks)
  if (!storedCurrency && !storedChannel) {
    localStorage.setItem(STORAGE_KEY_CURRENCY, 'INR');
    localStorage.setItem(STORAGE_KEY_CHANNEL, 'Ind-Snacks');
    return 'Ind-Snacks';
  }

  if (storedChannel) return storedChannel;

  // Default based on currency
  const currency = storedCurrency || 'INR';
  return getChannelTokenForCurrency(currency);
}

// Set stored channel token (both localStorage and cookie)
export function setStoredChannelToken(channelToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CHANNEL, channelToken);
  // Also set in cookie so server can read it
  document.cookie = `channel-token=${channelToken}; path=/; max-age=31536000; SameSite=Lax`;
}

// Static list of countries for address forms
export const STATIC_COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'UK' },
  { code: 'US', name: 'USA' },
  // European countries for EUR
  //   { code: 'IT', name: 'Italy' },
  //   { code: 'ES', name: 'Spain' },
  //   { code: 'FR', name: 'France' },
  //   { code: 'DE', name: 'Germany' },
  //   { code: 'NL', name: 'Netherlands' },
  //   { code: 'BE', name: 'Belgium' },
  //   { code: 'AT', name: 'Austria' },
  //   { code: 'PT', name: 'Portugal' },
  //   { code: 'IE', name: 'Ireland' },
  //   { code: 'GR', name: 'Greece' },
] as const;

// Currency to countries mapping
export const CURRENCY_COUNTRIES_MAP: Record<string, string[]> = {
  INR: ['IN'], // Only India for INR
  USD: ['US', 'CA', 'AU', 'SG', 'MY', 'LK', 'GB'], // USD-using countries
  // EUR: ['IT', 'ES', 'FR', 'DE', 'NL', 'BE', 'AT', 'PT', 'IE', 'GR'], // European countries
};

// Get countries for a currency
export function getCountriesForCurrency(
  currency: string,
): Array<{ code: string; name: string }> {
  const countryCodes = CURRENCY_COUNTRIES_MAP[currency] || [];
  return STATIC_COUNTRIES.filter((country) =>
    countryCodes.includes(country.code),
  );
}
