'use client';

import React, { type RefObject, useEffect } from 'react';
import { withZod } from '@remix-validated-form/with-zod';
import { z } from 'zod';
import { ValidatedForm, useField } from 'remix-validated-form';
import type { Address } from '~/generated/graphql';
import { Input } from '~/components/Input';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';
import {
  getCountriesForCurrency,
  getStoredCurrency,
  getStoredCountry,
} from '~/utils/country-currency';
// Removed Select component imports as PostalCodeSelect is removed
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '~/components/ui/select';
// import { ChannelPostalcode } from '~/lib/hygraph';

export const validator = withZod(
  z.object({
    fullName: z.string().min(1, { message: 'Name is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    postalCode: z.string().min(1, { message: 'Pincode is required' }),
    streetLine1: z.string().min(1, { message: 'Address is required' }),
    streetLine2: z.string().min(1, { message: 'Address is required' }), // <-- Make required
    phone: z
      .string()
      .regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' }),
    company: z.string().optional(),
    province: z.string().optional(), // ✅ Add this
    countryCode: z.string().min(1, { message: 'Country is required' }),
    addressType: z.string().min(1, { message: 'Address type is required' }),
    defaultShippingAddress: z.string().optional(),
    defaultBillingAddress: z.string().optional(),
  }),
);

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex w-full flex-col space-y-1', className)}>
      {children}
    </div>
  );
};

const ModernInput = ({
  label,
  name,
  required = false,
  autoComplete,
  type = 'text',
  defaultValue,
  readOnly = false,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
  type?: string;
  defaultValue?: string;
  readOnly?: boolean;
  [key: string]: any;
}) => (
  <LabelInputContainer>
    <label htmlFor={name} className="text-sm font-medium text-neutral-800">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Input
      id={name}
      name={name}
      type={type}
      required={required}
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      readOnly={readOnly}
      {...rest}
      className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm transition-all duration-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
    />
  </LabelInputContainer>
);

const AddressTypeSelect = () => {
  const { error, getInputProps } = useField('addressType');
  const [addressType, setAddressType] = React.useState<string>('');

  const addressTypeOptions = [
    { value: 'shipping', label: 'Default Shipping Address' },
    { value: 'billing', label: 'Default Billing Address' },
    { value: 'both', label: 'Default for Both Shipping & Billing' },
    { value: 'none', label: 'Regular Address (Not Default)' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAddressType(e.target.value);
    const event = new Event('input', { bubbles: true });
    e.target.dispatchEvent(event);
  };

  return (
    <LabelInputContainer>
      <label
        htmlFor="addressType"
        className="text-sm mt-5 font-medium text-neutral-800"
      >
        Address Type <span className="text-red-500">*</span>
      </label>
      <select
        {...getInputProps({
          id: 'addressType',
          onChange: handleChange,
        })}
        className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
      >
        <option value="">Select Address Type</option>
        {addressTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-500">{error}</span>}

      <input
        type="hidden"
        name="defaultShippingAddress"
        value={
          addressType === 'shipping' || addressType === 'both'
            ? 'true'
            : 'false'
        }
      />
      <input
        type="hidden"
        name="defaultBillingAddress"
        value={
          addressType === 'billing' || addressType === 'both' ? 'true' : 'false'
        }
      />
    </LabelInputContainer>
  );
};

const CountrySelect = ({ address }: { address?: Address }) => {
  const { error, getInputProps } = useField('countryCode');
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('INR');

  // Get currency from localStorage on mount and when it changes
  React.useEffect(() => {
    const currency = getStoredCurrency() || 'INR';
    setSelectedCurrency(currency);

    // Listen for storage changes (when currency changes in header)
    const handleStorageChange = () => {
      const newCurrency = getStoredCurrency() || 'INR';
      setSelectedCurrency(newCurrency);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for changes (since storage event only fires in other tabs)
    const interval = setInterval(() => {
      const currentCurrency = getStoredCurrency() || 'INR';
      if (currentCurrency !== selectedCurrency) {
        setSelectedCurrency(currentCurrency);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedCurrency]);

  // Get countries for the selected currency
  const currencyCountries = getCountriesForCurrency(selectedCurrency);

  // Get stored country from header selection
  const storedCountryCode = getStoredCountry();

  // Determine default country: use stored country if available and valid, otherwise use address country or empty
  const getDefaultCountryCode = () => {
    if (
      storedCountryCode &&
      currencyCountries.some((c) => c.code === storedCountryCode)
    ) {
      return storedCountryCode;
    }
    if (
      address?.country?.code &&
      currencyCountries.some((c) => c.code === address.country.code)
    ) {
      return address.country.code;
    }
    return '';
  };

  return (
    <LabelInputContainer>
      <label
        htmlFor="countryCode"
        className="text-sm font-medium text-neutral-800"
      >
        Country <span className="text-red-500">*</span>
      </label>
      <select
        key={`country-${selectedCurrency}-${getDefaultCountryCode()}`}
        {...getInputProps({
          id: 'countryCode',
        })}
        className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
      >
        <option value="">Select Country</option>
        {currencyCountries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </LabelInputContainer>
  );
};

export default function CustomerAddressForm({
  address,
  formRef,
  submit,
  isEditing = false,
  activeCustomer,
}: {
  address?: Address;
  formRef: RefObject<HTMLFormElement>;
  submit: () => void;
  isEditing?: boolean;
  activeCustomer?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}) {
  const { t } = useTranslation();

  // Combine firstName and lastName into fullName
  const fullName =
    activeCustomer?.firstName && activeCustomer?.lastName
      ? `${activeCustomer.firstName} ${activeCustomer.lastName}`
      : activeCustomer?.firstName || activeCustomer?.lastName || '';

  // Get default country code: use stored country if available and valid, otherwise use address country
  const getDefaultCountryCode = () => {
    const stored = getStoredCountry();
    const currency = getStoredCurrency() || 'INR';
    const currencyCountries = getCountriesForCurrency(currency);

    if (stored && currencyCountries.some((c) => c.code === stored)) {
      return stored;
    }
    if (
      address?.country?.code &&
      currencyCountries.some((c) => c.code === address.country.code)
    ) {
      return address.country.code;
    }
    return '';
  };

  const defaultCountryCode = getDefaultCountryCode();

  return (
    <div
      className="mx-auto w-full max-w-4xl bg-white"
      style={{ maxHeight: '90vh' }}
    >
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-neutral-800">
            {isEditing ? 'Edit Address Information' : 'New Address Information'}
          </h3>
          <p className="text-sm text-neutral-600">
            Please provide your complete address details for delivery
          </p>
        </div>

        <ValidatedForm
          id="editAddressForm"
          validator={validator}
          formRef={formRef}
          method="post"
          defaultValues={{
            fullName: isEditing ? address?.fullName || '' : fullName,
            city: address?.city || '',
            postalCode: address?.postalCode || '', // Use existing postalCode or empty string
            streetLine1: address?.streetLine1 || '',
            streetLine2: address?.streetLine2 || '',
            phone: isEditing
              ? address?.phoneNumber || ''
              : activeCustomer?.phoneNumber || '',
            company: address?.company || '',
            countryCode: defaultCountryCode,
            addressType:
              isEditing && address
                ? address.defaultShippingAddress &&
                  address.defaultBillingAddress
                  ? 'both'
                  : address.defaultShippingAddress
                  ? 'shipping'
                  : address.defaultBillingAddress
                  ? 'billing'
                  : 'none'
                : '',
          }}
        >
          <input
            type="hidden"
            name="intent"
            value={isEditing ? 'updateAddress' : 'createAddress'}
          />
          {isEditing && (
            <input type="hidden" name="addressId" value={address?.id} />
          )}

          <div className="space-y-4">
            <AddressTypeSelect />
            <ModernInput
              label="Full Name"
              name="fullName"
              required
              autoComplete="name"
              defaultValue={isEditing ? address?.fullName || '' : fullName}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ModernInput
                label="Door No"
                name="streetLine1"
                required
                autoComplete="address-line1"
              />
              <div className="md:col-span-2">
                <ModernInput
                  label="Address"
                  required // <-- Make required in UI
                  name="streetLine2"
                  autoComplete="address-line2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModernInput
                label="City"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={address?.city || ''}
              />
              <ModernInput
                label="Pincode"
                name="postalCode"
                required
                autoComplete="postal-code"
              />
            </div>
            <CountrySelect address={address} />
            <ModernInput
              label="Phone Number"
              name="phone"
              required
              type="tel"
              pattern="[0-9]{10}"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              defaultValue={
                isEditing
                  ? address?.phoneNumber || ''
                  : activeCustomer?.phoneNumber || ''
              }
            />
          </div>

          <div className="mt-6 border-gray-200 pt-4">
            <button
              type="submit"
              className="group/btn relative h-11 w-full rounded-md bg-amber-800   font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-all duration-200 hover:shadow-lg"
              onClick={submit}
            >
              {isEditing ? 'Update Address' : 'Create Address'}
              <BottomGradient />
            </button>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}

// Add CSS only in browser environment
if (typeof window !== 'undefined') {
  const styles = `
    .dropdown-down {
      position: relative;
    }
    .dropdown-down select {
      -webkit-appearance: menulist-button;
      appearance: menulist-button;
      position: relative;
      z-index: 10;
    }
    .dropdown-down select:focus + * {
      display: none;
    }
    .dropdown-down select::-ms-expand {
      display: none;
    }
    .dropdown-down select {
      padding-right: 1.5rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23333' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
    }
  `;

  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(styles);
  document.adoptedStyleSheets = [styleSheet];
}
