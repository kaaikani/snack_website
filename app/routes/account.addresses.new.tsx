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
import { getFixedT } from '~/i18next.server';
import type { ErrorResult } from '~/generated/graphql';
import { ErrorCode } from '~/generated/graphql';
import { getChannelPostalcodes } from '~/lib/hygraph';
import { getSessionStorage } from '~/sessions';
import { getChannelsByCustomerPhonenumber } from '~/providers/customPlugins/customPlugin';
import { validationError } from 'remix-validated-form';

// Define the expected activeCustomer type for CustomerAddressForm
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

  const phoneNumber = transformedActiveCustomer.phoneNumber;
  let channelCode = '';
  if (phoneNumber) {
    const channels = await getChannelsByCustomerPhonenumber(phoneNumber);
    channelCode = channels[0]?.code || '';
  }

  const channelPostalcodes = await getChannelPostalcodes();

  return json({
    activeCustomer: transformedActiveCustomer,
    channelCode,
    channelPostalcodes,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  const data = result.data;
  const t = await getFixedT(request);

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

export default function NewAddress() {
  const { activeCustomer, channelCode, channelPostalcodes } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  // ⛔ Prevent page scroll while modal is open
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Scrollable body inside modal */}
        <div className="relative max-h-[90vh] overflow-y-auto p-6">
          <button
            onClick={() => navigate('/account/addresses')}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <CustomerAddressForm
            formRef={formRef}
            submit={handleSubmit}
            isEditing={false}
            activeCustomer={activeCustomer}
            channelCode={channelCode}
            channelPostalcodes={channelPostalcodes}
          />
        </div>
      </div>
    </div>
  );
}
