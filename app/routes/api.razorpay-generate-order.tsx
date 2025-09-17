import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import {
  transitionOrderToState,
  getNextOrderStates,
} from '~/providers/checkout/checkout';
import { getActiveOrder } from '~/providers/orders/order';
import { getRazorpayOrderId } from '~/providers/customPlugins/customPlugin';

interface RazorpayOrderResponse {
  success: boolean;
  razorpayOrderId?: string;
  keyId?: string;
  error?: string;
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const orderCode = formData.get('orderCode') as string;

    if (!orderCode) {
      return json<RazorpayOrderResponse>(
        { success: false, error: 'Order code is required' },
        { status: 400 },
      );
    }

    const activeOrder = await getActiveOrder({ request });

    if (!activeOrder || activeOrder.code !== orderCode) {
      return json<RazorpayOrderResponse>(
        { success: false, error: 'Invalid order' },
        { status: 400 },
      );
    }

    const { nextOrderStates } = await getNextOrderStates({ request });
    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
        { request },
      );

      if (transitionResult.transitionOrderToState?.__typename !== 'Order') {
        return json<RazorpayOrderResponse>(
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

    // 🔄 Dynamically get Razorpay order from backend (channel-specific)
    const razorpayOrderResult = await getRazorpayOrderId(
      activeOrder.id,
      request,
    );

    if (!razorpayOrderResult || 'message' in razorpayOrderResult) {
      return json<RazorpayOrderResponse>(
        {
          success: false,
          error:
            (razorpayOrderResult as any)?.message ||
            'Failed to generate Razorpay order',
        },
        { status: 500 },
      );
    }

    return json<RazorpayOrderResponse>({
      success: true,
      razorpayOrderId: razorpayOrderResult.razorpayOrderId,
      keyId: razorpayOrderResult.keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order generation failed:', error);
    return json<RazorpayOrderResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
};
