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

import { HighlightedButton } from '~/components/HighlightedButton';
import AccountSidebar from '~/components/account/AccountSidebar';
import { MapPin } from 'lucide-react';

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
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <Outlet />
      <div className="min-h-screen bg-gray-50 flex relative">
        <AccountSidebar
          activeCustomer={
            activeCustomer || {
              firstName: '',
              lastName: '',
              emailAddress: '',
              phoneNumber: null,
            }
          }
        />

        {/* Main content */}
        <div className="flex-1">
          {/* Page content */}
          <div className=" min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-8 border-b">
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
