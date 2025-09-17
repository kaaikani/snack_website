import { Form } from '@remix-run/react';
import { CreditCardIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

export function OfflinePayment({ paymentMethodCode = 'cash-on-delivery' }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-gray-600 text-sm p-6">
        {t('checkout.offlinePayment')}
      </p>

      <Form method="post">
        <input
          type="hidden"
          name="paymentMethodCode"
          value={paymentMethodCode}
        />
        <button
          type="submit"
          className="flex px-6 bg-primary-600 hover:bg-primary-700 items-center justify-center space-x-2 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full md:w-auto"
        >
          <CreditCardIcon className="w-5 h-5" />
          <span>{`${t('checkout.payWith')} Offline`}</span>
        </button>
      </Form>
    </div>
  );
}
