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
import {
  Award,
  Menu,
  User,
  MapPin,
  ShoppingBag,
  X,
  LogOut,
} from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const sidebarNavigation = [
    {
      name: 'Details',
      href: '/account',
      icon: User,
    },
    {
      name: 'Addresses',
      href: '/account/addresses',
      icon: MapPin,
    },
    {
      name: 'PurchaseHistory',
      href: '/account/history',
      icon: ShoppingBag,
    },
    {
      name: 'Reward Points History',
      href: '/account/loyaltypointstransactions',
      icon: Award,
    },
  ];

  const activeCustomer = {
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between px-4 border-b">
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  navigation={sidebarNavigation}
                  activeCustomer={activeCustomer}
                  t={t}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          <SidebarContent
            navigation={sidebarNavigation}
            activeCustomer={activeCustomer}
            t={t}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {t('account.loyaltyPointsTransactions')}
          </h1>
        </div>

        {/* Page content */}
        <div className="bg-white min-h-screen">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b bg-white">
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
              <div className="absolute top-0 left-0 w-full h-full z-50 bg-white bg-opacity-75"></div>
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
                  <tbody className="bg-white divide-y divide-gray-200">
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
    </>
  );

  function SidebarContent({
    navigation,
    activeCustomer,
    t,
    onNavigate,
  }: {
    navigation: any[];
    activeCustomer: any;
    t: any;
    onNavigate?: () => void;
  }) {
    const { firstName, lastName, emailAddress, phoneNumber } = activeCustomer;
    const user = { firstName, lastName, emailAddress, phoneNumber };
    const links = navigation.map((item) => ({
      to: item.href,
      label: item.name,
      icon: item.icon,
    }));

    return <Sidebar user={user} links={links} onNavigate={onNavigate} />;
  }

  function Sidebar({
    user,
    links,
    onNavigate,
  }: {
    user: {
      firstName: string;
      lastName: string;
      emailAddress: string;
      phoneNumber?: string;
    };
    links: { to: string; label: string; icon: React.ElementType }[];
    onNavigate?: () => void;
  }) {
    const { t } = useTranslation();

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-8 border-b flex space-x-3">
          <a
            href="/home"
            className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
          >
            <img src="/KK-Logo.png" alt="logo" className="w-32 h-auto" />
          </a>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              end={to === '/account'}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-muted-foreground hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 mr-3 flex-shrink-0 ${
                      isActive ? 'text-blue-700' : ''
                    }`}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-6 border-t">
          <Form method="post" action="/api/logout">
            <button
              type="submit"
              className="group flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md w-full transition-colors"
              onClick={() => {
                setTimeout(() => {
                  window.location.href = '/';
                }, 50);
              }}
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              {t('account.signOut')}
            </button>
          </Form>
        </div>
      </div>
    );
  }
}
