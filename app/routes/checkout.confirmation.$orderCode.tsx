import { DataFunctionArgs } from '@remix-run/server-runtime';
import { getOrderByCode } from '~/providers/orders/order';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useLoaderData, useRevalidator } from '@remix-run/react';
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
  const { order, error, collections, loyaltyPoints } =
    useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [retries, setRetries] = useState(1);
  const [showAllItems, setShowAllItems] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const { t } = useTranslation();
  const { activeOrder, refresh } = useActiveOrder();
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
      <>
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-[90px]">
          <div className="max-w-md w-full text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t(
                orderNotFound
                  ? 'checkout.orderNotFound'
                  : 'checkout.orderErrorTitle',
              )}
            </h2>
            <p className="text-gray-600">
              {t(
                orderNotFound
                  ? 'checkout.orderNotFoundMessage'
                  : 'checkout.orderErrorMessage',
              )}
            </p>
          </div>
        </div>
      </>
    );
  }

  const displayedLines = showAllItems ? order!.lines : order!.lines.slice(0, 3);

  return (
    <>
      <div>
        <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-6 px-4 sm:px-6 lg:px-8">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span
                    className={`h-6 w-6 flex items-center justify-center rounded-full ${
                      currentStep >= index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`ml-4 text-sm font-medium ${
                      currentStep >= index ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step === 'shipping-cart'
                      ? 'Shipping & Cart'
                      : step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                  {index < steps.length - 1 && (
                    <svg
                      className="w-4 h-4 ml-2 text-gray-300"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 1l4 4-4 4"
                      />
                    </svg>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
      <main className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8 pt-[100px]">
        <div className="max-w-6xl mx-auto shadow-lg">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <CheckCircleIcon className="text-blue-600 w-10 h-10" />
              <h2 className="text-3xl font-bold text-gray-900">
                {t('order.summary')}
              </h2>
            </div>
            <p className="text-gray-600 mb-8 text-base sm:text-lg">
              {t('checkout.orderSuccessMessage')}{' '}
              <span className="font-semibold text-blue-600">{order!.code}</span>
            </p>
            {order!.active && (
              <div className="bg-blue-50 rounded-xl p-5 mb-8 flex items-start space-x-3">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {t('checkout.paymentMessage')}
                </p>
              </div>
            )}
            <div className="space-y-8">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Order Items
                </h3>
                <CartContents
                  orderLines={displayedLines}
                  currencyCode={order!.currencyCode}
                  editable={false}
                />
                {order!.lines.length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllItems(!showAllItems)}
                      className="text-blue-600 hover:underline text-sm font-medium flex items-center justify-center mx-auto"
                      aria-label={showAllItems ? 'Show Less' : 'View More'}
                    >
                      {showAllItems ? (
                        <img
                          src="/show-more.png"
                          alt="Show less"
                          className="w-6 h-6 transform rotate-180"
                          style={{ transform: 'rotate(180deg)' }}
                        />
                      ) : (
                        <img
                          src="/show-more.png"
                          alt={`View More (${order!.lines.length - 3} more)`}
                          className="w-6 h-6"
                        />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-6">
                <CartTotals
                  order={order as OrderDetailFragment}
                  editable={false}
                />
                <div className="mt-8 text-center">
                  <a
                    href="/"
                    className="inline-block bg-black text-white px-6 py-2 border rounded-full shadow hover:bg-white hover:border-black hover:text-black transition-colors duration-200 text-sm sm:text-base"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
