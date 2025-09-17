import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import {
  transitionOrderToState,
  getNextOrderStates,
  addPaymentToOrder,
} from '~/providers/checkout/checkout';
import { getActiveOrder } from '~/providers/orders/order';
import { updateOrderPlacedAtISTMutation } from '~/providers/customPlugins/customPlugin'; // Import the mutation

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
  const paymentMethodCode = 'online';

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

    // Create metadata for the payment
    const metadata = {
      method: 'online',
      status: 'completed',
      orderCode: orderCode,
      payment_details: {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      },
    };

    console.log('Adding payment to order with metadata:', metadata);

    // Add payment to the order
    const result = await addPaymentToOrder(
      { method: paymentMethodCode, metadata },
      { request },
    );

    if (result.addPaymentToOrder.__typename === 'Order') {
      // Call UpdateOrderPlacedAtIST after successful payment
      try {
        await updateOrderPlacedAtISTMutation(result.addPaymentToOrder.id, {
          request,
        });
        console.log(
          'OrderPlacedAtIST updated successfully for order:',
          result.addPaymentToOrder.id,
        );
      } catch (error: any) {
        console.error('Failed to update OrderPlacedAtIST:', error);
        // Optionally handle the error (e.g., log it, but proceed with redirect)
      }

      console.log('Payment added successfully, redirecting to confirmation');
      return redirect(
        `/checkout/confirmation/${result.addPaymentToOrder.code}`,
      );
    } else {
      console.error(
        'Failed to add payment to order:',
        result.addPaymentToOrder?.message,
      );
      return json<RazorpayPaymentResponse>(
        {
          success: false,
          error:
            result.addPaymentToOrder?.message ||
            'Failed to add payment to order',
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
