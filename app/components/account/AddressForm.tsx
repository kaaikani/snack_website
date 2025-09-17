import { AvailableCountriesQuery, OrderAddress } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';
import { json, LoaderFunctionArgs, redirect } from '@remix-run/server-runtime';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import { getSessionStorage } from '~/sessions';
import { getChannelsByCustomerPhonenumber } from '~/providers/customPlugins/customPlugin';
import { getChannelPostalcodes } from '~/lib/hygraph';

type ActiveCustomerFormType =
  | {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
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

export function AddressForm({
  address,
  defaultFullName,
  defaultPhoneNumber,
  availableCountries,
}: {
  address?: OrderAddress | null;
  defaultFullName?: string;
  defaultPhoneNumber?: string;
  availableCountries?: AvailableCountriesQuery['availableCountries'];
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700"
        >
          {t('account.fullName')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="fullName"
            name="fullName"
            defaultValue={defaultFullName}
            autoComplete="given-name"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="company"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.company')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="company"
            id="company"
            defaultValue={address?.company ?? ''}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="streetLine1"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.streetLine1')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="streetLine1"
            id="streetLine1"
            defaultValue={address?.streetLine1 ?? ''}
            autoComplete="street-address"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="streetLine2"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.streetLine2')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="streetLine2"
            id="streetLine2"
            defaultValue={address?.streetLine2 ?? ''}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.city')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="city"
            id="city"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="countryCode"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.country')}
        </label>
        <div className="mt-1">
          {availableCountries && (
            <select
              id="countryCode"
              name="countryCode"
              defaultValue={address?.countryCode ?? 'US'}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {availableCountries.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="province"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.province')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="province"
            id="province"
            defaultValue={address?.province ?? ''}
            autoComplete="address-level1"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="postalCode"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.postalCode')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="postalCode"
            id="postalCode"
            defaultValue={address?.postalCode ?? ''}
            autoComplete="postal-code"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700"
        >
          {t('address.phoneNumber')}
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="phoneNumber"
            id="phoneNumber"
            defaultValue={address?.phoneNumber ?? defaultPhoneNumber ?? ''}
            autoComplete="tel"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
