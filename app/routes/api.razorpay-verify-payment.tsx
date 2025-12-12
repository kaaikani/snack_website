import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import {
  transitionOrderToState,
  getNextOrderStates,
} from '~/providers/checkout/checkout';
import { addPaymentToOrder } from '~/providers/orders/order';
import { getActiveOrder } from '~/providers/orders/order';

interface RazorpayPaymentResponse {
  success: boolean;
  orderCode?: string;
  error?: string;
  redirectUrl?: string;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const paymentId = formData.get('razorpay_payment_id') as string;
  const orderId = formData.get('razorpay_order_id') as string;
  const signature = formData.get('razorpay_signature') as string;
  const orderCode = formData.get('orderCode') as string;
  const amount = formData.get('amount') as string;
  const currencyCode = formData.get('currencyCode') as string;
  // Get eligible payment methods to find the correct code
  const { getEligiblePaymentMethods } = await import(
    '~/providers/checkout/checkout'
  );
  const paymentMethods = await getEligiblePaymentMethods({ request });

  // Find the Razorpay payment method
  // Backend handler code is 'razorpay-payment' but might also be 'online'
  const razorpayPaymentMethod = paymentMethods.eligiblePaymentMethods.find(
    (method) =>
      method.code === 'razorpay-payment' ||
      method.code === 'online' ||
      method.code.toLowerCase().includes('razorpay') ||
      method.code.toLowerCase().includes('online'),
  );

  const paymentMethodCode = razorpayPaymentMethod?.code || 'razorpay-payment';

  if (!razorpayPaymentMethod) {
    console.error(
      'Razorpay payment method not found. Available methods:',
      paymentMethods.eligiblePaymentMethods.map((m) => ({
        code: m.code,
        name: m.name,
      })),
    );
    return json<RazorpayPaymentResponse>(
      { success: false, error: 'Razorpay payment method not found' },
      { status: 400 },
    );
  }

  console.log('Using payment method:', {
    code: paymentMethodCode,
    name: razorpayPaymentMethod.name,
  });

  if (!paymentId || !orderId || !signature) {
    return json<RazorpayPaymentResponse>(
      { success: false, error: 'Missing payment information' },
      { status: 400 },
    );
  }

  try {
    // Transition order state if needed
    const { nextOrderStates } = await getNextOrderStates({ request });
    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
        { request },
      );
      if (transitionResult.transitionOrderToState?.__typename !== 'Order') {
        console.error(
          'Failed to transition order state:',
          transitionResult.transitionOrderToState?.message,
        );
        return json<RazorpayPaymentResponse>(
          {
            success: false,
            error:
              transitionResult.transitionOrderToState?.message ||
              'Failed to transition order state',
          },
          { status: 400 },
        );
      }
    }

    // Get the active order to get the amount and currency
    const activeOrder = await getActiveOrder({ request });
    if (!activeOrder) {
      return json<RazorpayPaymentResponse>(
        { success: false, error: 'No active order found' },
        { status: 400 },
      );
    }

    // Verify order code matches
    if (activeOrder.code !== orderCode) {
      console.error('Order code mismatch:', {
        expected: activeOrder.code,
        received: orderCode,
      });
      return json<RazorpayPaymentResponse>(
        { success: false, error: 'Order code mismatch' },
        { status: 400 },
      );
    }

    // Calculate amounts for verification
    const orderAmountInPaise = activeOrder.totalWithTax || 0;
    const orderAmountInRupees = (orderAmountInPaise / 100).toFixed(2);
    const razorpayAmountInPaise = amount ? Number.parseInt(amount, 10) : null;

    // Log amount verification
    console.log('Amount Verification:', {
      orderAmountPaise: orderAmountInPaise,
      orderAmountRupees: orderAmountInRupees,
      razorpayAmountPaise: razorpayAmountInPaise,
      razorpayAmountRupees: razorpayAmountInPaise
        ? (razorpayAmountInPaise / 100).toFixed(2)
        : null,
      amountsMatch:
        razorpayAmountInPaise !== null &&
        razorpayAmountInPaise === orderAmountInPaise,
    });

    // Verify amount matches (optional check - backend will also verify)
    if (
      razorpayAmountInPaise !== null &&
      razorpayAmountInPaise !== orderAmountInPaise
    ) {
      console.warn('Amount mismatch detected:', {
        orderAmount: orderAmountInPaise,
        razorpayAmount: razorpayAmountInPaise,
        difference: Math.abs(orderAmountInPaise - razorpayAmountInPaise),
      });
    }

    // Create metadata for the payment
    // Backend expects camelCase property names: razorpayPaymentId, razorpayOrderId, razorpaySignature
    const metadata = {
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature,
    };

    const orderCurrency = activeOrder.currencyCode || currencyCode || 'INR';

    console.log('📋 Payment Details Summary:', {
      orderCode: orderCode,
      paymentMethod: paymentMethodCode,
      amount: orderAmountInRupees,
      currency: orderCurrency,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      hasSignature: !!signature,
      orderState: activeOrder.state,
    });

    console.log(
      '📦 Metadata being sent to backend (camelCase format):',
      metadata,
    );

    // Add payment to the order
    const result = await addPaymentToOrder(
      { method: paymentMethodCode, metadata },
      { request },
    );

    console.log('Result of addPaymentToOrder:', result);

    if (result.success) {
      const redirectUrl = `/checkout/confirmation/${result.order.code}`;
      console.log('Payment added successfully, redirecting to:', redirectUrl);
      return redirect(redirectUrl);
    } else {
      // Handle all error types with proper typing
      const errorResult = result.error;

      console.error('Failed to add payment to order:', {
        errorType: errorResult.__typename,
        errorCode: errorResult.errorCode,
        message: errorResult.message,
      });

      // Provide user-friendly error messages based on error type
      let errorMessage =
        errorResult.message || 'Failed to add payment to order';

      switch (errorResult.__typename) {
        case 'OrderPaymentStateError':
          errorMessage = `Order payment state error: ${errorResult.message}`;
          break;
        case 'IneligiblePaymentMethodError':
          errorMessage = `Payment method not eligible: ${errorResult.message}`;
          break;
        case 'PaymentFailedError':
          errorMessage = `Payment failed: ${errorResult.message}`;
          break;
        case 'PaymentDeclinedError':
          errorMessage = `Payment declined: ${errorResult.message}`;
          break;
        case 'OrderStateTransitionError':
          errorMessage = `Order state error: ${errorResult.message}`;
          break;
        case 'NoActiveOrderError':
          errorMessage = `No active order found: ${errorResult.message}`;
          break;
      }

      return json<RazorpayPaymentResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Razorpay payment processing error:', error);
    return json<RazorpayPaymentResponse>(
      {
        success: false,
        error: error.message || 'An error occurred processing the payment',
      },
      { status: 500 },
    );
  }
};
