'use client';

import type React from 'react';
import {
  Outlet,
  useLoaderData,
  NavLink,
  Form,
  useLocation,
} from '@remix-run/react';
import {
  type ActionFunctionArgs,
  json,
  redirect,
} from '@remix-run/server-runtime';
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
import type { LoaderFunctionArgs } from '@remix-run/router';
import { useNavigate } from '@remix-run/react';
import { HighlightedButton } from '~/components/HighlightedButton';
import { MapPin } from 'lucide-react';
import AccountHeader from '~/components/account/AccountHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';

// Define the expected type for activeCustomer to match AccountHeaderProps
interface ActiveCustomer {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string | null | undefined;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await getActiveCustomerAddresses({ request });
  const activeCustomerAddresses = res.activeCustomer;

  const { activeCustomer } = await getActiveCustomerDetails({ request });

  if (!activeCustomer) {
    return redirect('/sign-in');
  }

  return json({
    activeCustomerAddresses,
    activeCustomer: {
      firstName: activeCustomer.firstName,
      lastName: activeCustomer.lastName,
      emailAddress: activeCustomer.emailAddress,
      phoneNumber: activeCustomer.phoneNumber,
    } as ActiveCustomer,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

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

      if (result && result.__typename === 'Address') {
        return json({ success: true, message: 'Address created successfully' });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: 'Failed to create address',
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Create address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: 'Failed to create address',
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
          message: 'Invalid address ID',
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

      if (result && result.__typename === 'Address') {
        return json({ success: true, message: 'Address updated successfully' });
      } else {
        return json<ErrorResult>(
          {
            errorCode: ErrorCode.UnknownError,
            message: 'Failed to update address',
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Update address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: 'Failed to update address',
        },
        { status: 500 },
      );
    }
  }

  // Existing action handlers
  const id = formData.get('id') as string | null;
  const _action = formData.get('_action');

  if (!id || id.length === 0) {
    return json<ErrorResult>(
      {
        errorCode: ErrorCode.IdentifierChangeTokenInvalidError,
        message: 'Invalid address ID',
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
            message: 'Failed to update address',
          },
          { status: 400 },
        );
      }
    } catch (error) {
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: 'Failed to update address',
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
            message: 'Failed to update address',
          },
          { status: 400 },
        );
      }
    } catch (error) {
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: 'Failed to update address',
        },
        { status: 500 },
      );
    }
  }

  if (_action === 'deleteAddress') {
    try {
      const result = await deleteCustomerAddress(id, { request });
      return json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Delete address error:', error);
      return json<ErrorResult>(
        {
          errorCode: ErrorCode.UnknownError,
          message: 'Failed to delete address',
        },
        { status: 400 },
      );
    }
  }

  return json<ErrorResult>(
    {
      message: 'An unknown error occurred',
      errorCode: ErrorCode.UnknownError,
    },
    {
      status: 400,
    },
  );
}

export default function AccountAddresses() {
  const { activeCustomerAddresses, activeCustomer } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ffedc7] pt-10">
      <AccountHeader activeCustomer={activeCustomer} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <MapPin className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Addresses
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Manage your shipping and billing addresses
                  </CardDescription>
                </div>
              </div>
              <HighlightedButton
                type="button"
                className="h-10 px-4 bg-[#FF4D4D] hover:bg-[#FF6B6B] text-white"
                onClick={() => navigate('/account/addresses/new')}
              >
                Add New Address
              </HighlightedButton>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!activeCustomerAddresses?.addresses ||
            activeCustomerAddresses.addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Addresses Found
                </h3>
                <p className="text-gray-600">Add an address to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeCustomerAddresses.addresses.map((address) => (
                  <EditAddressCard
                    address={address as Address}
                    key={address.id}
                    className="bg-gray-50 rounded-lg p-4"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Outlet />
    </div>
  );
}
