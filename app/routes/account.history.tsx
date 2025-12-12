'use client';

import {
  useLoaderData,
  useNavigation,
  useSubmit,
  useLocation,
  NavLink,
  Form,
} from '@remix-run/react';
import {
  type DataFunctionArgs,
  json,
  redirect,
  type ActionFunctionArgs,
} from '@remix-run/server-runtime';
import OrderHistoryItem from '~/components/account/OrderHistoryItem';
import {
  getActiveCustomerOrderList,
  getActiveCustomerDetails,
} from '~/providers/customer/customer';
import { requestOrderCancellation } from '~/providers/customPlugins/customPlugin';
import { type OrderListOptions, SortOrder } from '~/generated/graphql';
import { Pagination } from '~/components/Pagination';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import {
  translatePaginationFrom,
  translatePaginationTo,
  paginationValidationSchema,
} from '~/utils/pagination';
import { z } from 'zod';
import { useState } from 'react';
import { HighlightedButton } from '~/components/HighlightedButton';
import AccountHeader from '~/components/account/AccountHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { ShoppingBag } from 'lucide-react';

const paginationLimitMinimumDefault = 10;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  20,
  30,
]);
const orderPaginationSchema = paginationValidationSchema(
  allowedPaginationLimits,
);

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'cancel-order') {
    const orderId = formData.get('orderId') as string;
    const reason = formData.get('reason') as string;

    if (!reason || reason.trim() === '') {
      return json(
        {
          success: false,
          message: 'Please provide a reason for cancellation.',
        },
        { status: 400 },
      );
    }

    try {
      const result = await requestOrderCancellation(orderId, reason.trim(), {
        request,
      });

      return json({
        success: true,
        message:
          'Cancel request submitted successfully. Admin approval pending.',
        result,
      });
    } catch (error) {
      return json(
        {
          success: false,
          message: 'Failed to submit cancel request. Please try again.',
        },
        { status: 400 },
      );
    }
  }

  return json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const limit =
    Number(url.searchParams.get('limit')) || paginationLimitMinimumDefault;
  const page = Number(url.searchParams.get('page')) || 1;

  const zodResult = orderPaginationSchema.safeParse({ limit, page });
  if (!zodResult.success) {
    url.search = '';
    return redirect(url.href);
  }

  const orderListOptions: OrderListOptions = {
    take: zodResult.data.limit,
    skip: (zodResult.data.page - 1) * zodResult.data.limit,
    sort: { createdAt: SortOrder.Desc },
    filter: { active: { eq: false } },
  };

  const [res, { activeCustomer }] = await Promise.all([
    getActiveCustomerOrderList(orderListOptions, { request }),
    getActiveCustomerDetails({ request }),
  ]);

  if (!res.activeCustomer || !activeCustomer) {
    return redirect('/sign-in');
  }

  return json({
    orderList: res.activeCustomer.orders,
    appliedPaginationLimit: zodResult.data.limit,
    appliedPaginationPage: zodResult.data.page,
    activeCustomer,
  });
}

export default function AccountHistory() {
  const {
    orderList,
    appliedPaginationLimit,
    appliedPaginationPage,
    activeCustomer,
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const showingOrdersFrom = translatePaginationFrom(
    appliedPaginationPage,
    appliedPaginationLimit,
  );
  const showingOrdersTo = translatePaginationTo(
    appliedPaginationPage,
    appliedPaginationLimit,
    orderList.items.length,
  );
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#ffedc7] pt-10">
      <AccountHeader activeCustomer={activeCustomer} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <ShoppingBag className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Purchase History
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  View your past orders
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {navigation.state !== 'idle' && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full" />
              </div>
            )}
            {orderList.items.length === 0 ? (
              <div className="py-16 text-center text-gray-600 italic">
                {orderList.totalItems === 0
                  ? 'No orders found'
                  : 'No more orders to show'}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {orderList.items.map((item) => (
                    <OrderHistoryItem
                      key={item.code}
                      order={item as any}
                      isInitiallyExpanded={true}
                      className="bg-gray-50 rounded-lg p-4"
                    />
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <span className="text-sm text-gray-600">
                    Showing {showingOrdersFrom} to {showingOrdersTo} of{' '}
                    {orderList.totalItems} orders
                  </span>
                  <ValidatedForm
                    validator={withZod(
                      paginationValidationSchema(allowedPaginationLimits),
                    )}
                    method="get"
                    onChange={(e) =>
                      submit(e.currentTarget, { preventScrollReset: true })
                    }
                    preventScrollReset
                  >
                    <Pagination
                      appliedPaginationLimit={appliedPaginationLimit}
                      allowedPaginationLimits={allowedPaginationLimits}
                      totalItems={orderList.totalItems}
                      appliedPaginationPage={appliedPaginationPage}
                    />
                  </ValidatedForm>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
