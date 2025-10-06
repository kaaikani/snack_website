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
import {
  getActiveCustomer,
  getActiveCustomerDetails,
} from '~/providers/customer/customer';
import { Pagination } from '~/components/Pagination';
import AccountHeader from '~/components/account/AccountHeader';
import { useState, useEffect } from 'react';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { paginationValidationSchema } from '~/utils/pagination';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Award } from 'lucide-react';

const paginationLimitMinimumDefault = 10;
const allowedPaginationLimits = new Set<number>([10, 20, 30]);

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit =
    Number(url.searchParams.get('limit')) || paginationLimitMinimumDefault;

  const [res, { activeCustomer }] = await Promise.all([
    getActiveCustomer({
      request,
      variables: {
        options: {
          take: limit,
          skip: (page - 1) * limit,
        },
      },
    }),
    getActiveCustomerDetails({ request }),
  ]);

  if (!res.activeCustomer || !activeCustomer) {
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
    activeCustomer,
  });
}

export default function AccountLoyaltyPointsTransactions() {
  const {
    transactions,
    totalItems,
    loyaltyPointsAvailable,
    page,
    limit,
    activeCustomer,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
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

  return (
    <div className="min-h-screen bg-[#ffedc7] pt-10">
      <AccountHeader activeCustomer={activeCustomer} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Award className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Loyalty Points
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Your available points: {loyaltyPointsAvailable}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {navigation.state !== 'idle' && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <div className="animate-spin h-8 w-8 border-4 border-[#FF4D4D] border-t-transparent rounded-full" />
              </div>
            )}
            {totalItems === 0 ? (
              <div className="py-16 text-center text-gray-600 italic">
                No loyalty points available
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Order Code
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-gray-50 transition-all duration-200"
                        >
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {tx.note}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-medium ${
                              tx.value > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.value}
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-600">
                            {tx.order ? tx.order.code : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <span className="text-sm text-gray-600">
                    Showing {showingFrom} to {showingTo} of {totalItems}{' '}
                    transactions
                  </span>
                  <ValidatedForm
                    validator={withZod(
                      paginationValidationSchema(allowedPaginationLimits),
                    )}
                    method="get"
                    onChange={(e) =>
                      setSearchParams(new FormData(e.currentTarget) as any)
                    }
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
