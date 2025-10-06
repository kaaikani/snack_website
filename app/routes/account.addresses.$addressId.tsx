'use client';

import {
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
  useNavigation,
} from '@remix-run/react';
import {
  type DataFunctionArgs,
  json,
  redirect,
} from '@remix-run/server-runtime';
import { useRef, useEffect } from 'react';
import { validationError } from 'remix-validated-form';
import Modal from '~/components/modal/Modal';
import type { Address } from '~/generated/graphql';
import useToggleState from '~/utils/use-toggle-state';
import CustomerAddressForm, {
  validator,
} from '~/components/account/CustomerAddressForm';
import { updateCustomerAddress } from '~/providers/account/account';
import { getAvailableCountries } from '~/providers/checkout/checkout';
import { getActiveCustomerAddresses } from '~/providers/customer/customer';

type AddressUpdateInput = {
  id: string;
  city: string;
  company?: string | undefined;
  countryCode: string;
  fullName: string;
  phoneNumber: string;
  postalCode: string;
  province?: string | undefined;
  streetLine1: string;
  streetLine2?: string | undefined;
  defaultShippingAddress?: boolean | undefined;
  defaultBillingAddress?: boolean | undefined;
};

export async function loader({ request, params }: DataFunctionArgs) {
  const { activeCustomer } = await getActiveCustomerAddresses({ request });
  const address = activeCustomer?.addresses?.find(
    (address) => address.id === params.addressId,
  );

  if (!address) {
    return redirect('/account/addresses');
  }

  const { availableCountries } = await getAvailableCountries({ request });
  return json({
    address,
    availableCountries,
  });
}

export async function action({ request, params }: DataFunctionArgs) {
  const formData = await request.formData();
  const result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  const { data } = result;

  const addressTypeData: AddressUpdateInput = {
    id: params.addressId!,
    city: data.city,
    company: data.company,
    countryCode: data.countryCode || 'IN',
    fullName: data.fullName,
    phoneNumber: data.phone,
    postalCode: data.postalCode,
    province: data.province || '',
    streetLine1: data.streetLine1,
    streetLine2: data.streetLine2,
  };

  if (data.defaultShippingAddress !== undefined) {
    addressTypeData.defaultShippingAddress =
      data.defaultShippingAddress === 'true';
  }
  if (data.defaultBillingAddress !== undefined) {
    addressTypeData.defaultBillingAddress =
      data.defaultBillingAddress === 'true';
  }

  try {
    await updateCustomerAddress(addressTypeData, { request });
    return json({ saved: true });
  } catch (error) {
    return json(
      { saved: false, error: 'Failed to update address' },
      { status: 500 },
    );
  }
}

export default function EditAddress() {
  const { address, availableCountries } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ saved?: boolean; error?: string }>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { state, close } = useToggleState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  useEffect(() => {
    if (state) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [state]);

  useEffect(() => {
    if (actionData?.saved) {
      close();
    }
  }, [actionData]);

  const submitForm = () => {
    if (formRef.current) {
      submit(formRef.current);
    }
  };

  const customClose = () => {
    close();
  };

  const afterClose = () => {
    navigate(-1);
  };

  return (
    <div>
      <Modal isOpen={state} close={customClose} afterClose={afterClose}>
        <Modal.Title>Edit Address</Modal.Title>
        <Modal.Body>
          <div className="max-h-[80vh] overflow-y-auto">
            <CustomerAddressForm
              address={address as Address}
              availableCountries={availableCountries}
              formRef={formRef}
              submit={submitForm}
              isEditing={true}
            />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
