'use client';

import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from '@remix-run/server-runtime';
import { useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import { useEffect, useRef } from 'react';
import CustomerAddressForm, {
  validator,
} from '~/components/account/CustomerAddressForm';
import { createCustomerAddress } from '~/providers/account/account';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import type { ErrorResult } from '~/generated/graphql';
import { ErrorCode } from '~/generated/graphql';
import { validationError } from 'remix-validated-form';
import { getSessionStorage } from '~/sessions';
import { X } from 'lucide-react';

type ActiveCustomerFormType =
  | {
      firstName?: string | undefined;
      lastName?: string | undefined;
      phoneNumber?: string | undefined;
    }
  | undefined;

export async function loader({ request }: LoaderFunctionArgs) {
  const { activeCustomer } = await getActiveCustomerDetails({ request });

  if (!activeCustomer) {
    const sessionStorage = await getSessionStorage();
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );

    session.unset('authToken');
    session.unset('channelToken');

    return redirect('/sign-in', {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }

  const transformedActiveCustomer: ActiveCustomerFormType = {
    firstName: activeCustomer.firstName,
    lastName: activeCustomer.lastName,
    phoneNumber: activeCustomer.phoneNumber ?? undefined,
  };

  return json({
    activeCustomer: transformedActiveCustomer,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  const data = result.data;

  const addressData = {
    fullName: data.fullName,
    streetLine1: data.streetLine1,
    streetLine2: data.streetLine2 || undefined,
    city: data.city,
    postalCode: data.postalCode,
    phoneNumber: data.phone,
    company: data.company || undefined,
    defaultShippingAddress: data.defaultShippingAddress === 'true',
    defaultBillingAddress: data.defaultBillingAddress === 'true',
    countryCode: 'IN',
    province: '',
  };

  try {
    const result = await createCustomerAddress(addressData, { request });

    if (result && result.__typename === 'Address') {
      return redirect('/account/addresses');
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

export default function NewAddress() {
  const { activeCustomer } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (formRef.current && !formRef.current.checkValidity()) {
      e?.preventDefault();
      formRef.current.reportValidity();
      return;
    }
    submit(formRef.current, { method: 'post' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
        <button
          onClick={() => navigate('/account/addresses')}
          className="absolute right-4 top-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add New Address
          </h2>
          <CustomerAddressForm
            formRef={formRef}
            submit={handleSubmit}
            isEditing={false}
            activeCustomer={activeCustomer}
          />
        </div>
      </div>
    </div>
  );
}
