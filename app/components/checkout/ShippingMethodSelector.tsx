import { RadioGroup } from '@headlessui/react';
import { Price } from '~/components/products/Price';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import {
  CurrencyCode,
  EligibleShippingMethodsQuery,
} from '~/generated/graphql';

// Helper for joining class names
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
      <div className="mt-4 grid grid-cols-1 gap-4 ">
        {eligibleShippingMethods.map((shippingMethod) => (
          <RadioGroup.Option
            key={shippingMethod.id}
            value={shippingMethod.id}
            className={({ active, checked }) =>
              classNames(
                'relative flex cursor-pointer rounded-lg p-4 transition-all duration-200 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-500',
                checked
                  ? 'bg-amber-800 text-white shadow-lg ring-2 ring-amber-500' // Selected state
                  : 'bg-white text-black hover:bg-amber-600', // Default state
              )
            }
          >
            {({ checked }) => (
              <>
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <RadioGroup.Label
                      as="span"
                      className={classNames(
                        'block text-sm font-semibold',
                        checked ? 'text-stone-100' : 'text-amber-100', // Text color changes on selection
                      )}
                    >
                      {shippingMethod.name}
                    </RadioGroup.Label>
                    <RadioGroup.Description
                      as="span"
                      className={classNames(
                        'mt-1 flex items-center text-sm',
                        checked ? 'text-stone-600' : 'text-stone-300', // Text color changes on selection
                      )}
                    >
                      {shippingMethod.priceWithTax === 0 ? (
                        <span className="font-semibold text-green-500">Free</span>
                      ) : (
                        <Price
                          priceWithTax={shippingMethod.priceWithTax}
                          currencyCode={currencyCode}
                        />
                      )}
                    </RadioGroup.Description>
                  </span>
                </span>
                {checked && (
                  <CheckCircleIcon
                    className="h-6 w-6 text-amber-600"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}