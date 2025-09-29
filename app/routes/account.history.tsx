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
import { getActiveCustomerOrderList } from '~/providers/customer/customer';
import { cancelOrderOnClientRequest } from '~/providers/customPlugins/customPlugin';
import { type OrderListOptions, SortOrder } from '~/generated/graphql';
import { Pagination } from '~/components/Pagination';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import {
  translatePaginationFrom,
  translatePaginationTo,
  paginationValidationSchema,
} from '~/utils/pagination';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useState } from 'react';
import { HighlightedButton } from '~/components/HighlightedButton';
import AccountSidebar from '~/components/account/AccountSidebar';

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
    const value = formData.get('value') as string;

    try {
      const result = await cancelOrderOnClientRequest(
        orderId,
        Number.parseInt(value),
        { request },
      );

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

  const res = await getActiveCustomerOrderList(orderListOptions, { request });
  if (!res.activeCustomer) {
    return redirect('/sign-in');
  }

  // Type assertion to ensure the data matches the component's expected type
  return json({
    orderList: res.activeCustomer.orders,
    appliedPaginationLimit: zodResult.data.limit,
    appliedPaginationPage: zodResult.data.page,
  });
}

export default function AccountHistory() {
  const { orderList, appliedPaginationLimit, appliedPaginationPage } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const { t } = useTranslation();
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

  // Dummy activeCustomer for sidebar (replace with real data if available)
  const activeCustomer = {
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      <AccountSidebar activeCustomer={activeCustomer} />

      {/* Main content */}
      <div className="flex-1">
        {/* Page content */}
        <div className="min-h-screen">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b ">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                {t('account.purchaseHistory')}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t(
                  'account.purchaseHistorySubheading',
                  'View and manage your past orders',
                )}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Loading-Overlay */}
            {navigation.state !== 'idle' && (
              <div className="absolute top-0 left-0 w-full h-full z-50 bg-opacity-75"></div>
            )}

            {orderList.items.length === 0 && (
              <div className="py-16 text-3xl text-center italic text-gray-300 select-none flex justify-center items-center">
                {orderList.totalItems === 0
                  ? t('order.historyEmpty')
                  : t('order.historyEnd')}
              </div>
            )}

            {/* The actual orders */}
            {orderList.items?.map((item) => (
              <OrderHistoryItem
                key={item.code}
                order={item as any} // Type assertion to resolve the type mismatch
                isInitiallyExpanded={true}
                className="mb-10"
              />
            ))}

            {/* Pagination */}
            <div className="flex flex-row justify-between items-center gap-4">
              <span className="self-start text-gray-500 text-sm ml-4 lg:ml-6 mt-2">
                Showing orders {showingOrdersFrom} to {showingOrdersTo} of{' '}
                {orderList.totalItems}
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
          </div>
        </div>
      </div>
    </div>
  );
}
