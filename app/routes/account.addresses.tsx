'use client';

import type React from 'react';
import {
  Outlet,
  useLoaderData,
  NavLink,
  Form,
  useLocation,
} from '@remix-run/react';
import { type ActionFunctionArgs, json } from '@remix-run/server-runtime';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import EditAddressCard from '~/components/account/EditAddressCard';
import { type Address, ErrorCode, type ErrorResult } from '~/generated/graphql';
import {
  deleteCustomerAddress,
  updateCustomerAddress,
  createCustomerAddress,
} from '~/providers/account/account';
import {
  getActiveCustomerAddresses,
  getActiveCustomerDetails,
} from '~/providers/customer/customer';
import { getFixedT } from '~/i18next.server';
import type { LoaderFunctionArgs } from '@remix-run/router';
import { useNavigate } from '@remix-run/react';

// Lucide icons
import {
  MapPin,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  Award,
} from 'lucide-react';
import { HighlightedButton } from '~/components/HighlightedButton';

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await getActiveCustomerAddresses({ request });
  const activeCustomerAddresses = res.activeCustomer;

  // Also get customer details for sidebar
  const { activeCustomer } = await getActiveCustomerDetails({ request });

  return json({ activeCustomerAddresses, activeCustomer });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const t = await getFixedT(request);

  // Handle creating a new address
  if (intent === 'createAddress') {
    const addressData = {
      fullName: formData.get('fullName') as string,
      streetLine1: formData.get('streetLine1') as string,
      streetLine2: (formData.get('streetLine2') as string) || undefined,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
      countryCode: formData.get('countryCode') as string,
      phoneNumber: formData.get('phone') as string,
      company: (formData.get('company') as string) || undefined,
      defaultShippingAddress: formData.get('defaultShippingAddress') === 'true',
      defaultBillingAddress: formData.get('defaultBillingAddress') === 'true',
    };

    try {
      const result = await createCustomerAddress(addressData, { request });

      // Check if result is an Address object (success) or has an error
      if (result && result.__typename === 'Address') {
        return json({ success: true, message: t('address.created') });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: t('address.createError'),
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Create address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: t('address.createError'),
        },
        { status: 500 },
      );
    }
  }

  // Handle updating an existing address
  if (intent === 'updateAddress') {
    const id = formData.get('addressId') as string;
    if (!id) {
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.IdentifierChangeTokenInvalidError,
          message: t('address.idError'),
        },
        { status: 400 },
      );
    }

    const addressData = {
      fullName: formData.get('fullName') as string,
      streetLine1: formData.get('streetLine1') as string,
      streetLine2: (formData.get('streetLine2') as string) || undefined,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
      countryCode: formData.get('countryCode') as string,
      phoneNumber: formData.get('phone') as string,
      company: (formData.get('company') as string) || undefined,
      defaultShippingAddress: formData.get('defaultShippingAddress') === 'true',
      defaultBillingAddress: formData.get('defaultBillingAddress') === 'true',
    };

    try {
      const result = await updateCustomerAddress(
        { id, ...addressData },
        { request },
      );

      // Check if result is an Address object (success) or has an error
      if (result && result.__typename === 'Address') {
        return json({ success: true, message: t('address.updated') });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: t('address.updateError'),
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Update address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: t('address.updateError'),
        },
        { status: 500 },
      );
    }
  }

  // Existing action handlers
  const id = formData.get('id') as string | null;
  const _action = formData.get('_action');

  // Verify that id is set for existing actions
  if (!id || id.length === 0) {
    return json<ErrorResult>(
      {
        errorCode: ErrorCode.IdentifierChangeTokenInvalidError,
        message: t('address.idError'),
      },
      {
        status: 400,
      },
    );
  }

  if (_action === 'setDefaultShipping') {
    try {
      const result = await updateCustomerAddress(
        { id, defaultShippingAddress: true },
        { request },
      );
      if (result && result.__typename === 'Address') {
        return json({ success: true });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: t('address.updateError'),
          },
          { status: 400 },
        );
      }
    } catch (error) {
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: t('address.updateError'),
        },
        { status: 500 },
      );
    }
  }

  if (_action === 'setDefaultBilling') {
    try {
      const result = await updateCustomerAddress(
        { id, defaultBillingAddress: true },
        { request },
      );
      if (result && result.__typename === 'Address') {
        return json({ success: true });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: t('address.updateError'),
          },
          { status: 400 },
        );
      }
    } catch (error) {
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: t('address.updateError'),
        },
        { status: 500 },
      );
    }
  }

  if (_action === 'deleteAddress') {
    try {
      const result = await deleteCustomerAddress(id, { request });
      // Assuming deleteCustomerAddress returns a boolean or similar success indicator
      return json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Delete address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: t('address.deleteError'),
        },
        { status: 400 },
      );
    }
  }

  return json<ErrorResult>(
    {
      message: t('common.unknowError'),
      errorCode: ErrorCode.UnknownError,
    },
    {
      status: 400,
    },
  );
}

// Rest of your component code remains the same...
export default function AccountAddresses() {
  const { activeCustomerAddresses, activeCustomer } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
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
  const navigate = useNavigate();

  return (
    <>
      <Outlet />
      <div className="min-h-screen bg-gray-50 flex">
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
                  <h2 className="text-lg font-semibold">Menu</h2>
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
                    navigation={navigation}
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
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 pt-[90px]">
          <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
            <SidebarContent
              navigation={navigation}
              activeCustomer={activeCustomer}
              t={t}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-64 pt-[80px]">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Addresses</h1>
          </div>

          {/* Page content */}
          <div className="bg-white min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b bg-white">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">My Addresses</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Manage your shipping and billing addresses
                </p>
              </div>
              <HighlightedButton
                type="button"
                className="self-start lg:self-auto"
                onClick={() => navigate('/account/addresses/new')}
              >
                Add Address
              </HighlightedButton>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Existing Addresses */}
                {activeCustomerAddresses?.addresses?.map((address) => (
                  <EditAddressCard
                    address={address as Address}
                    key={address.id}
                  />
                ))}
              </div>

              {/* Empty state */}
              {(!activeCustomerAddresses?.addresses ||
                activeCustomerAddresses.addresses.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No addresses yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add your first address to get started with faster checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
  const { firstName, lastName, emailAddress, phoneNumber } =
    activeCustomer || {};
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
