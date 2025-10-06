import { DataFunctionArgs } from '@remix-run/server-runtime';
import { getOrderByCode } from '~/providers/orders/order';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useLoaderData, useRevalidator, Link } from '@remix-run/react';
import { CartContents } from '~/components/cart/CartContents';
import { CartTotals } from '~/components/cart/CartTotals';
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { OrderDetailFragment } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';
import { useActiveOrder } from '~/utils/use-active-order';
import { getCollections } from '~/providers/collections/collections';

// Keep steps consistent with checkout flow
const steps = ['shipping-cart', 'payment', 'confirmation'];

export async function loader({ params, request }: DataFunctionArgs) {
  const collections = await getCollections(request);
  const activeCustomer = await getActiveCustomer({ request });
  try {
    const order = await getOrderByCode(params.orderCode!, { request });
    return {
      order,
      error: false,
      collections,
      loyaltyPoints:
        activeCustomer.activeCustomer?.customFields?.loyaltyPointsAvailable ??
        null,
    };
  } catch (ex) {
    return {
      order: null,
      error: true,
      collections,
      loyaltyPoints:
        activeCustomer.activeCustomer?.customFields?.loyaltyPointsAvailable ??
        null,
    };
  }
}

export default function CheckoutConfirmation() {
  const { order, error } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [retries, setRetries] = useState(1);
  const [showAllItems, setShowAllItems] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const { t } = useTranslation();
  const { refresh } = useActiveOrder();
  const currentStep = 2; // confirmation

  const orderNotFound = !order && !error;
  const orderErrored = !order && error;
  const maxRetries = 5;
  const retryTimeout = 2500;

  useEffect(() => {
    if (orderErrored && retries <= maxRetries) {
      const timeout = setTimeout(() => {
        setRetries((prev) => prev + 1);
        revalidator.revalidate();
      }, retryTimeout);
      return () => clearTimeout(timeout);
    }
  }, [orderErrored, retries, revalidator]);

  useEffect(() => {
    if (order && !orderErrored && !orderNotFound && !hasRefreshed) {
      console.log('Refreshing active order on confirmation page');
      refresh();
      setHasRefreshed(true);
    }
  }, [order, orderErrored, orderNotFound, hasRefreshed, refresh]);

  if (orderNotFound || (orderErrored && retries > maxRetries)) {
    return (
      <div className="bg-amber-50 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-[90px]">
        <div className="max-w-md w-full text-center py-12">
          <h2 className="text-3xl font-bold text-stone-800 mb-4">
            {t(
              orderNotFound
                ? 'checkout.orderNotFound'
                : 'checkout.orderErrorTitle',
            )}
          </h2>
          <p className="text-stone-600">
            {t(
              orderNotFound
                ? 'checkout.orderNotFoundMessage'
                : 'checkout.orderErrorMessage',
            )}
          </p>
        </div>
      </div>
    );
  }

  const displayedLines = showAllItems
    ? order!.lines
    : order!.lines.slice(0, 3);

  return (
    <>
      {/* The main background for the entire confirmation page */}
      <main className="min-h-screen mt-20 bg-amber-100 py-10 px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="lg:max-w-4xl mx-auto mb-8">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <li key={step} className="flex-1 flex items-center">
                  <span
                    className={`h-8 w-8 flex items-center justify-center rounded-full font-bold ${
                      currentStep >= index
                        ? 'bg-amber-800 text-white'
                        : 'bg-amber-200 text-amber-700'
                    }`}
                  >
                    {currentStep > index ? '✓' : index + 1}
                  </span>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      currentStep >= index
                        ? 'text-amber-800'
                        : 'text-stone-500'
                    }`}
                  >
                    {step === 'shipping-cart'
                      ? 'Shipping & Cart'
                      : step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 w-full h-0.5 ml-4 bg-amber-200" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* The main confirmation card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-amber-200/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <CheckCircleIcon className="text-green-500 w-12 h-12 flex-shrink-0" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
                  Order Summary
                </h2>
                <p className="text-stone-600 mt-1 text-base">
                  Your order has been received:{' '}
                  <span className="font-semibold text-amber-800">
                    {order!.code}
                  </span>
                </p>
              </div>
            </div>

            {order!.active && (
              <div className="bg-amber-50 rounded-lg p-4 mb-8 flex items-start space-x-3 border border-amber-200">
                <InformationCircleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {t('checkout.paymentMessage')}
                </p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-stone-800 mb-4">
                  Order Items
                </h3>
                <div className="border-t border-b border-stone-200 divide-y divide-stone-200">
                  <CartContents
                    orderLines={displayedLines}
                    currencyCode={order!.currencyCode}
                    editable={false}
                  />
                </div>
                {order!.lines.length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllItems(!showAllItems)}
                      className="text-amber-700 hover:text-amber-900 text-sm font-semibold flex items-center justify-center mx-auto"
                      aria-label={showAllItems ? 'Show Less' : 'View More'}
                    >
                      {showAllItems ? 'Show Less' : 'View More Items'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <CartTotals
                  order={order as OrderDetailFragment}
                  editable={false}
                />
                <div className="mt-8 pt-6 border-t border-stone-200 text-center">
                  <Link
                    to="/"
                    className="inline-block bg-amber-800 text-white px-8 py-3 rounded-lg shadow-md hover:bg-amber-900 transition-colors duration-300 font-semibold text-base"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}