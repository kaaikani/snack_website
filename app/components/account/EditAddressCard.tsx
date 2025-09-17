import {
  ArrowPathIcon,
  CreditCardIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { Link, useFetcher } from '@remix-run/react';
import clsx from 'clsx';
import { useState } from 'react';
import { Address, ErrorResult } from '~/generated/graphql';
import { Button } from '../Button';
import { ErrorMessage } from '../ErrorMessage';
import { HighlightedButton } from '../HighlightedButton';
import Modal from '../modal/Modal';
import { useTranslation } from 'react-i18next';

type EditAddressProps = {
  address: Address;
  isActive?: boolean;
};

export default function EditAddressCard({
  address,
  isActive = false,
}: EditAddressProps) {
  const setShipping = useFetcher();
  const setBilling = useFetcher();
  const deleteAddress = useFetcher<ErrorResult>();
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalVisible}
        close={() =>
          setDeleteModalVisible(deleteAddress.state === 'idle' ? false : true)
        }
      >
        <deleteAddress.Form method="post" preventScrollReset>
          <Modal.Title>{t('address.deleteModal.title')}</Modal.Title>
          <Modal.Body>
            <div className="space-y-4 my-4">
              {t('address.deleteModal.confirmation')}
              <input type="hidden" name="id" value={address.id} />
              {deleteAddress.data && (
                <ErrorMessage
                  heading={t('address.deleteModal.error')}
                  message={
                    deleteAddress.data?.message ?? t('common.defaultError')
                  }
                />
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              onClick={() => setDeleteModalVisible(false)}
              disabled={deleteAddress.state !== 'idle'}
            >
              {t('common.cancel')}
            </Button>
            <HighlightedButton
              type="submit"
              name="_action"
              value="deleteAddress"
              disabled={deleteAddress.state !== 'idle'}
              isSubmitting={deleteAddress.state !== 'idle'}
            >
              {t('common.yes')}
            </HighlightedButton>
          </Modal.Footer>
        </deleteAddress.Form>
      </Modal>

      {/* Address Card */}
      <div
        className={clsx(
          'border rounded-xl shadow-sm p-6 bg-white min-h-[220px] flex flex-col justify-between transition-all hover:shadow-md',
          {
            'border-primary': isActive,
            'border-gray-200': !isActive,
          },
        )}
      >
        <div className="flex justify-between gap-4">
          {/* Address Info */}
          <div className="space-y-1 text-sm text-gray-800">
            <p className="font-semibold text-base">{address.fullName}</p>
            {address.company && <p>{address.company}</p>}
            <div className="text-gray-600">
              <p>
                {address.streetLine1}
                {address.streetLine2 && `, ${address.streetLine2}`}
              </p>
              <p>
                {address.postalCode}, {address.city}
              </p>
              <p>
                {address.province && `${address.province}, `}
                {address.country?.code?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Default Labels */}
          {(address.defaultShippingAddress ||
            address.defaultBillingAddress) && (
            <div className="text-end text-xs uppercase text-gray-400 font-semibold leading-tight">
              <p className="text-sm text-gray-500">{t('common.default')}</p>
              <p className="mt-1">
                {address.defaultShippingAddress && t('common.shipping')}
                {address.defaultShippingAddress &&
                  address.defaultBillingAddress && <br />}
                {address.defaultBillingAddress && t('common.billing')}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-700">
          <div className="flex gap-4">
            <Link
              role="button"
              preventScrollReset
              className="flex items-center gap-2 hover:text-primary transition-colors"
              to={`/account/addresses/${address.id}`}
            >
              <PencilIcon className="w-4 h-4" />
              {t('common.edit')}
            </Link>

            <button
              type="button"
              title="Delete this address"
              className="flex items-center gap-2 hover:text-destructive transition-colors"
              disabled={deleteAddress.state !== 'idle'}
              onClick={() => setDeleteModalVisible(true)}
            >
              {deleteAddress.state === 'idle' ? (
                <TrashIcon className="w-4 h-4" />
              ) : (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              )}
              {t('common.remove')}
            </button>
          </div>

          {/* Shipping/Billing buttons if not already default */}
          {(!address.defaultShippingAddress ||
            !address.defaultBillingAddress) && (
            <div className="flex gap-4 mt-2 sm:mt-0">
              {!address.defaultShippingAddress && (
                <setShipping.Form method="post">
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    name="_action"
                    value="setDefaultShipping"
                    type="submit"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                    disabled={setShipping.state !== 'idle'}
                  >
                    {setShipping.state === 'idle' ? (
                      <TruckIcon className="w-4 h-4" />
                    ) : (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    )}
                    {t('common.shipping')}
                  </button>
                </setShipping.Form>
              )}

              {!address.defaultBillingAddress && (
                <setBilling.Form method="post">
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    name="_action"
                    value="setDefaultBilling"
                    type="submit"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                    disabled={setBilling.state !== 'idle'}
                  >
                    {setBilling.state === 'idle' ? (
                      <CreditCardIcon className="w-4 h-4" />
                    ) : (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    )}
                    {t('common.billing')}
                  </button>
                </setBilling.Form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
