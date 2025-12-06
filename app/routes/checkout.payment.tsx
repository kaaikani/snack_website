'use client';

import { type FormEvent, useState, useEffect } from 'react';
import { Form, useFetcher } from '@remix-run/react';
import { useNavigate } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/server-runtime';
import { json, redirect } from '@remix-run/server-runtime';
import {
  getNextOrderStates,
  transitionOrderToState,
  addPaymentToOrder,
} from '~/providers/checkout/checkout';
import { getActiveOrder } from '~/providers/orders/order';
import { useTranslation } from 'react-i18next';
import { ErrorCode, type ErrorResult } from '~/generated/graphql';
import { RazorpayPayments } from '~/components/checkout/razorpay/RazorpayPayments';

interface FetcherData {
  success?: boolean;
  error?: ErrorResult;
  redirectUrl?: string;
}

interface PaymentStepProps {
  eligiblePaymentMethods: any[];
  activeOrder: any;
  stripePaymentIntent?: string;
  stripePublishableKey?: string;
  stripeError?: string;
  brainTreeKey?: string;
  brainTreeError?: string;
  onNext: () => void;
  onPrev: () => void;
}

export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData();
  const paymentMethodCode = body.get('paymentMethodCode');
  const paymentNonce = body.get('paymentNonce');

  if (typeof paymentMethodCode === 'string') {
    const { nextOrderStates } = await getNextOrderStates({
      request,
    });

    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
        { request },
      );
      if (transitionResult.transitionOrderToState?.__typename !== 'Order') {
        throw new Response('Not Found', {
          status: 400,
          statusText: transitionResult.transitionOrderToState?.message,
        });
      }
    }

    let metadata = {};
    if (paymentMethodCode === 'online' && paymentNonce) {
      try {
        const paymentData = JSON.parse(paymentNonce as string);
        metadata = {
          method: 'online',
          amount: (Number(paymentData.amount) / 100).toFixed(2) || 0,
          currencyCode: paymentData.currencyCode || 'INR',
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_signature: paymentData.razorpay_signature,
          orderCode: paymentData.orderCode,
        };
      } catch (e) {
        console.error('Error parsing payment nonce:', e);
        metadata = { nonce: paymentNonce };
      }
    } else if (paymentMethodCode === 'offline') {
      const activeOrder = await getActiveOrder({ request });
      metadata = {
        method: 'offline',
        amount: Number(((activeOrder?.totalWithTax || 0) / 100).toFixed(2)),
        currencyCode: activeOrder?.currencyCode || 'INR',
      };
    }

    console.log('Adding payment to order with:', {
      method: paymentMethodCode,
      metadata,
    });

    const result = await addPaymentToOrder(
      { method: paymentMethodCode, metadata },
      { request },
    );

    if (result.addPaymentToOrder.__typename === 'Order') {
      return redirect(
        `/checkout/confirmation/${result.addPaymentToOrder.code}`,
      );
    } else {
      throw new Response('Not Found', {
        status: 400,
        statusText: result.addPaymentToOrder?.message,
      });
    }
  }

  return json({ success: false });
}

export default function PaymentStep({
  eligiblePaymentMethods,
  activeOrder,
  stripePaymentIntent,
  stripePublishableKey,
  stripeError,
  brainTreeKey,
  brainTreeError,
  onNext,
  onPrev,
}: PaymentStepProps) {
  const [paymentMode, setPaymentMode] = useState<'online' | 'offline' | null>(
    null,
  );
  const fetcher = useFetcher<FetcherData>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isShippingMethodSelected =
    !!activeOrder?.shippingLines?.[0]?.shippingMethod;
  const paymentError = getPaymentError(fetcher.data?.error);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (paymentMode && fetcher.state === 'idle') {
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      formData.append('action', 'addPayment');
      fetcher.submit(formData, { method: 'post', action: '/checkout/payment' });
    }
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      onNext();
    }
  }, [fetcher.data, onNext]);

  return (
    <div>
      <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-black mb-6">Payment Method</h2>
        <div className="flex flex-col items-center divide-black divide-y space-y-6">
          <div className="w-full">
            {isShippingMethodSelected && (
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-colors duration-200 ${
                    paymentMode === 'online'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-black hover:bg-gray-100'
                  }`}
                >
                  Online Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('offline')}
                  className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-colors duration-200 ${
                    paymentMode === 'offline'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-black hover:bg-gray-100'
                  }`}
                >
                  Cash on Delivery
                </button>
              </div>
            )}
          </div>
          <div className="py-6 w-full">
            {isShippingMethodSelected && paymentMode && (
              <Form
                method="post"
                action="/checkout/payment"
                onSubmit={handleSubmit}
              >
                <input
                  type="hidden"
                  name="paymentMethodCode"
                  value={paymentMode}
                />
                {paymentMode === 'online' && (
                  <>
                    <p className="text-sm text-black mb-4">
                      By clicking the Place Order button, you confirm that you
                      have read, understand and accept our Terms of Use, Terms
                      of Sale and Returns Policy and acknowledge that you have
                      read South Mithai Store's Privacy Policy.
                    </p>
                    <RazorpayPayments
                      orderCode={activeOrder?.code ?? ''}
                      amount={activeOrder?.totalWithTax ?? 0}
                      currencyCode={activeOrder?.currencyCode ?? 'INR'}
                      customerEmail={activeOrder?.customer?.emailAddress ?? ''}
                      customerName={`${
                        activeOrder?.customer?.firstName ?? ''
                      } ${activeOrder?.customer?.lastName ?? ''}`.trim()}
                      customerPhone={
                        activeOrder?.shippingAddress?.phoneNumber ?? ''
                      }
                    />
                  </>
                )}
                {paymentMode === 'offline' && (
                  <>
                    <input
                      type="hidden"
                      name="paymentNonce"
                      value={JSON.stringify({
                        method: 'offline',
                        status: 'pending',
                        amount: activeOrder?.totalWithTax || 0,
                        currencyCode: activeOrder?.currencyCode || 'INR',
                        orderCode: activeOrder?.code || '',
                      })}
                    />
                    <p className="text-sm text-black mb-4">
                      By clicking the Place Order button, you confirm that you
                      have read, understand and accept our Terms of Use, Terms
                      of Sale and Returns Policy and acknowledge that you have
                      read south Mithai Store's Privacy Policy.
                    </p>
                    <button
                      type="submit"
                      className="w-full bg-black border hover:bg-white hover:text-black hover:border-black rounded-md py-3 px-4 text-base font-medium text-white"
                      disabled={fetcher.state !== 'idle'}
                    >
                      {fetcher.state === 'submitting'
                        ? 'Processing...'
                        : 'Place Order'}
                    </button>
                  </>
                )}
                {!eligiblePaymentMethods.find(
                  (m) => m.code === paymentMode,
                ) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      {paymentMode === 'online'
                        ? 'Online payment is not available. Please contact support if you need to pay online.'
                        : 'Offline payment is not available. Please contact support for assistance.'}
                    </p>
                  </div>
                )}
              </Form>
            )}
          </div>
        </div>
        {paymentError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{paymentError}</p>
          </div>
        )}
        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
function getPaymentError(error?: ErrorResult): string | undefined {
  if (!error || !error.errorCode) {
    return undefined;
  }
  switch (error.errorCode) {
    case ErrorCode.OrderPaymentStateError:
    case ErrorCode.IneligiblePaymentMethodError:
    case ErrorCode.PaymentFailedError:
    case ErrorCode.PaymentDeclinedError:
    case ErrorCode.OrderStateTransitionError:
    case ErrorCode.NoActiveOrderError:
      return error.message;
  }
}
