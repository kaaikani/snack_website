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
import {
  Menu,
  User,
  MapPin,
  ShoppingBag,
  X,
  LogOut,
  Award,
} from 'lucide-react';
// Sidebar and HighlightedButton imports (adjust path as needed)
import { HighlightedButton } from '~/components/HighlightedButton';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Sidebar navigation config
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

  // Dummy activeCustomer for sidebar (replace with real data if available)
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
            {t('account.purchaseHistory')}
          </h1>
        </div>

        {/* Page content */}
        <div className="bg-white min-h-screen">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b bg-white">
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
              <div className="absolute top-0 left-0 w-full h-full z-50 bg-white bg-opacity-75"></div>
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
    </>
  );

  // SidebarContent and Sidebar components (copied from account.tsx/account.addresses.tsx)
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
        {/* User profile section */}
        <div className="px-6 py-8 border-b flex space-x-3">
          <a
            href="/home"
            className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
          >
            <img src="/KK-Logo.png" alt="logo" className="w-32 h-auto" />
          </a>
        </div>
        {/* Navigation */}
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

        {/* Sign out */}
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
