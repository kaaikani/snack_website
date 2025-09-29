'use client';

import {
  useLoaderData,
  useNavigation,
  NavLink,
  Form,
  useSearchParams,
} from '@remix-run/react';
import {
  type DataFunctionArgs,
  json,
  redirect,
} from '@remix-run/server-runtime';
import { getActiveCustomer } from '~/providers/customer/customer';
import { Pagination } from '~/components/Pagination';
import { useTranslation } from 'react-i18next';
import AccountSidebar from '~/components/account/AccountSidebar';
import { useState, useEffect } from 'react';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { paginationValidationSchema } from '~/utils/pagination';

const paginationLimitMinimumDefault = 10;
const allowedPaginationLimits = new Set<number>([10, 20, 30]);

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit =
    Number(url.searchParams.get('limit')) || paginationLimitMinimumDefault;

  const res = await getActiveCustomer({
    request,
    variables: {
      options: {
        take: limit,
        skip: (page - 1) * limit,
      },
    },
  });

  if (!res.activeCustomer) {
    return redirect('/sign-in');
  }

  const transactions =
    res.activeCustomer.loyaltyPointsTransactions?.items || [];
  const totalItems =
    res.activeCustomer.loyaltyPointsTransactions?.totalItems || 0;
  const loyaltyPointsAvailable =
    res.activeCustomer.customFields?.loyaltyPointsAvailable || 0;

  return json({
    transactions,
    totalItems,
    loyaltyPointsAvailable,
    page,
    limit,
  });
}

export default function AccountLoyaltyPointsTransactions() {
  const { transactions, totalItems, loyaltyPointsAvailable, page, limit } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!allowedPaginationLimits.has(limit) || page < 1) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('limit', paginationLimitMinimumDefault.toString());
      newParams.set('page', '1');
      setSearchParams(newParams);
    }
  }, [limit, page, searchParams, setSearchParams]);

  const showingFrom = (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, totalItems);

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
        <div className=" min-h-screen">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Loyalty Points Transactions
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                View your loyalty points history. Available points:{' '}
                {loyaltyPointsAvailable}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Loading-Overlay */}
            {navigation.state !== 'idle' && (
              <div className="absolute top-0 left-0 w-full h-full z-50 bg-opacity-75"></div>
            )}

            {totalItems === 0 && (
              <div className="py-16 text-3xl text-center italic text-gray-300 select-none flex justify-center items-center">
                No loyalty points transactions yet.
              </div>
            )}

            {/* Transactions Table */}
            {transactions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Points
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Order Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.note}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            tx.value > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.order ? (
                            <td className="text-blue-600">{tx.order.code}</td>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-row justify-between items-center gap-4 mt-6">
              <span className="self-start text-gray-500 text-sm ml-4 lg:ml-6 mt-2">
                Showing {showingFrom} to {showingTo} of {totalItems}
              </span>

              <ValidatedForm
                validator={withZod(
                  paginationValidationSchema(allowedPaginationLimits),
                )}
                method="get"
                onChange={(e) => {
                  const formData = new FormData(e.currentTarget);
                  setSearchParams(formData as any);
                }}
                preventScrollReset
              >
                <Pagination
                  appliedPaginationLimit={limit}
                  allowedPaginationLimits={allowedPaginationLimits}
                  totalItems={totalItems}
                  appliedPaginationPage={page}
                />
              </ValidatedForm>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
