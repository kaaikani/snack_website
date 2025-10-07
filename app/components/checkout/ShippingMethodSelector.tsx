import { RadioGroup } from '@headlessui/react';
import { Price } from '~/components/products/Price';
// 1. Import TruckIcon for better visuals
import { CheckCircleIcon, TruckIcon } from '@heroicons/react/24/solid';
import {
  CurrencyCode,
  EligibleShippingMethodsQuery,
} from '~/generated/graphql';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ShippingMethodSelector({
  eligibleShippingMethods,
  currencyCode,
  shippingMethodId,
  onChange,
}: {
  eligibleShippingMethods: EligibleShippingMethodsQuery['eligibleShippingMethods'];
  shippingMethodId: string | undefined;
  onChange: (value?: string) => void;
  currencyCode?: CurrencyCode;
}) {
  return (
    <RadioGroup value={shippingMethodId} onChange={onChange}>
      {/* 2. Added a title for the section */}
      <h3 className="text-lg font-semibold text-stone-800 border-b pb-2 mb-4">
        Shipping Method
      </h3>
      <div className="space-y-4">
        {eligibleShippingMethods.map((shippingMethod) => (
          <RadioGroup.Option
            key={shippingMethod.id}
            value={shippingMethod.id}
            className={({ checked }) =>
              classNames(
                'relative flex cursor-pointer rounded-lg p-4 border-2 transition-all duration-200 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
                // 3. Updated styles for better visibility and design
                checked
                  ? 'bg-amber-50 border-amber-600 shadow-md' // Selected state
                  : 'bg-white border-stone-200 hover:border-amber-500', // Default state
              )
            }
          >
            {({ checked }) => (
              <>
                {/* 4. Restructured the layout with an icon */}
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <TruckIcon
                      className={classNames(
                        'h-8 w-8',
                        checked ? 'text-amber-700' : 'text-stone-400',
                      )}
                    />
                    <RadioGroup.Label
                      as="span"
                      className={classNames(
                        'block text-sm font-semibold',
                        checked ? 'text-amber-900' : 'text-stone-800', // High-contrast text
                      )}
                    >
                      {shippingMethod.name}
                    </RadioGroup.Label>
                  </div>

                  <div className="flex items-center gap-4">
                    <RadioGroup.Description
                      as="span"
                      className={classNames(
                        'text-sm font-semibold',
                        checked ? 'text-amber-900' : 'text-stone-800', // High-contrast text
                      )}
                    >
                      {shippingMethod.priceWithTax === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <Price
                          priceWithTax={shippingMethod.priceWithTax}
                          currencyCode={currencyCode}
                        />
                      )}
                    </RadioGroup.Description>
                    {checked && (
                      <CheckCircleIcon
                        className="h-6 w-6 text-amber-600"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}