import { LoaderFunction, json, ActionFunction } from '@remix-run/node';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import {
  getCouponCodeList,
  applyCouponCode,
  removeCouponCode,
} from '~/providers/orders/order';
import { QueryOptions } from '~/graphqlWrapper';
// Define TypeScript interfaces for type safety
interface Order {
  __typename: 'Order';
  total: number;
}

interface CouponCodeInvalidError {
  __typename: 'CouponCodeInvalidError';
  message: string;
}
interface CouponsComponentProps {
  couponCodes: string[];
  appliedCoupon?: string | null; // Optional, depends on activeOrder structure
}
// Loader to fetch coupon codes
export const loader: LoaderFunction = async ({ request }) => {
  const options: QueryOptions = { request };
  const couponCodes = await getCouponCodeList(options);
  return json({ couponCodes });
};

// Action to handle coupon application and removal
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const couponCode = formData.get('couponCode') as string;
  const actionType = formData.get('actionType') as string;

  if (actionType === 'apply') {
    if (!couponCode) {
      return json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    try {
      const result = await applyCouponCode(couponCode, { request });
      if (result?.__typename === 'Order') {
        // Assert result as Order to ensure total is recognized
        const order = result as Order;
        return json({
          success: true,
          message: `Coupon "${couponCode}" applied to your order!`,
          orderTotal: order.total,
          appliedCoupon: couponCode,
        });
      } else if (result?.__typename === 'CouponCodeInvalidError') {
        return json(
          { error: result.message || 'Invalid coupon code.' },
          { status: 400 },
        );
      }
      return json(
        { error: 'Unexpected response from server.' },
        { status: 500 },
      );
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      return json(
        { error: 'An error occurred while applying the coupon.' },
        { status: 500 },
      );
    }
  } else if (actionType === 'remove') {
    if (!couponCode) {
      return json(
        { error: 'Coupon code is required for removal.' },
        { status: 400 },
      );
    }

    try {
      const result = await removeCouponCode(couponCode, { request });
      if (result?.__typename === 'Order') {
        // Assert result as Order to ensure total is recognized
        // Note: Assumes removeCouponCode returns an Order with total; verify in ~/providers/orders/order.ts
        const order = result as Order;
        return json({
          success: true,
          message: 'Coupon removed from your order.',
          orderTotal: order.total,
          appliedCoupon: null,
        });
      }
      return json({ error: 'Failed to remove coupon.' }, { status: 500 });
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      return json(
        { error: 'An error occurred while removing the coupon.' },
        { status: 500 },
      );
    }
  }

  return json({ error: 'Invalid action type.' }, { status: 400 });
};
export default function CouponsComponent({
  couponCodes,
  appliedCoupon,
}: CouponsComponentProps) {
  const actionData = useActionData<{
    couponError?: string;
  }>();

  return (
    <div className="mt-4 bg-black w-80 p-3 rounded-md shadow border border-gray-200 text-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Coupon Codes
      </h3>

      {actionData?.couponError && (
        <div className="mb-3 px-2 py-1.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-300">
          {actionData.couponError}
        </div>
      )}

      {couponCodes?.length > 0 ? (
        <ul className="space-y-2">
          {couponCodes.map((code) => {
            const isApplied = appliedCoupon === code;

            return (
              <li
                key={code}
                className={`p-2 rounded border flex justify-between items-center ${
                  isApplied
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <span className="text-xs font-medium text-gray-800">
                  {code}
                </span>
                <Form method="post" className="ml-2">
                  <input
                    type="hidden"
                    name="actionType"
                    value={isApplied ? 'remove' : 'apply'}
                  />
                  <input type="hidden" name="couponCode" value={code} />
                  <button
                    type="submit"
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      isApplied
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isApplied ? 'Remove' : 'Apply'}
                  </button>
                </Form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 mt-3 text-center">
          No coupon codes available at the moment.
        </p>
      )}
    </div>
  );
}
