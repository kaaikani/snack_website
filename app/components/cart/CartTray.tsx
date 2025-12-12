'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CartContents } from './CartContents';
import { Link, useLocation } from '@remix-run/react';
import { Price } from '~/components/products/Price';
import { CurrencyCode, OrderDetailFragment } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';

// Define CartLoaderData explicitly to match /api/active-order.ts loader
export interface CartLoaderData {
  activeOrder?: OrderDetailFragment | null;
}

type UnavailableItemSummary = {
  reason?: string | null;
  productName?: string | null;
  variantName?: string | null;
};

function formatUnavailableReason(reason?: string | null): string {
  if (!reason) {
    return 'This item is currently unavailable.';
  }
  const normalized = reason.toUpperCase();
  switch (normalized) {
    case 'OUT_OF_STOCK':
    case 'INSUFFICIENT_STOCK':
    case 'ORDER_LINE_OUT_OF_STOCK':
      return 'This item is out of stock.';
    case 'PRODUCT_DISABLED':
    case 'PRODUCT_VARIANT_DISABLED':
    case 'DISABLED':
      return 'This item is currently Unavailable.';
    default:
      const cleaned = reason
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) {
        return 'This item is currently unavailable.';
      }
      return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}.`;
  }
}

export function CartTray({
  open,
  onClose,
  activeOrder,
  adjustOrderLine,
  removeItem,
}: {
  open: boolean;
  onClose: (closed: boolean) => void;
  activeOrder: OrderDetailFragment | null | undefined;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
}) {
  const currencyCode = activeOrder?.currencyCode || CurrencyCode.Usd;
  const location = useLocation();
  const editable = !location.pathname.startsWith('/checkout');
  const { t } = useTranslation();
  const validationStatus = activeOrder?.validationStatus;

  const unavailableItemsByLineId = (
    validationStatus?.unavailableItems ?? []
  ).reduce<Record<string, UnavailableItemSummary>>((acc, item) => {
    if (item && item.orderLineId) {
      acc[item.orderLineId] = {
        reason: item.reason,
        productName: item.productName,
        variantName: item.variantName,
      };
    }
    return acc;
  }, {});

  const outOfStockLineIds = new Set(
    (activeOrder?.lines ?? [])
      .filter((line) => line.productVariant.stockLevel === 'OUT_OF_STOCK')
      .map((line) => line.id),
  );

  const blockedLineSummaries = (activeOrder?.lines ?? []).reduce<
    Array<{ id: string; label: string; message: string }>
  >((acc, line) => {
    const unavailableEntry = unavailableItemsByLineId[line.id];
    const isOutOfStock = outOfStockLineIds.has(line.id);
    if (!unavailableEntry && !isOutOfStock) {
      return acc;
    }
    const message = isOutOfStock
      ? 'This item is out of stock.'
      : formatUnavailableReason(unavailableEntry?.reason);
    const label =
      unavailableEntry?.variantName ||
      line.productVariant.name ||
      unavailableEntry?.productName ||
      line.productVariant.product.slug ||
      'Item';
    acc.push({ id: line.id, label, message });
    return acc;
  }, []);

  const isOrderValid = validationStatus?.isValid !== false;
  const hasUnavailableItems = validationStatus?.hasUnavailableItems ?? false;
  const hasValidationIssue =
    !isOrderValid || hasUnavailableItems || blockedLineSummaries.length > 0;
  const canCheckout =
    (activeOrder?.totalQuantity ?? 0) > 0 && !hasValidationIssue;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-20"
        onClose={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300 sm:duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300 sm:duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen sm:max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        {t('cart.title')}
                      </Dialog.Title>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={() => onClose(false)}
                        >
                          <span className="sr-only">
                            {t('common.closePanel')}
                          </span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      {activeOrder?.totalQuantity ? (
                        <CartContents
                          orderLines={activeOrder?.lines ?? []}
                          currencyCode={currencyCode}
                          editable={editable}
                          removeItem={removeItem}
                          adjustOrderLine={adjustOrderLine}
                          unavailableItemsByLineId={unavailableItemsByLineId}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-48 text-xl text-gray-400">
                          {t('cart.empty')}
                        </div>
                      )}
                    </div>
                  </div>

                  {(activeOrder?.totalQuantity ?? 0) > 0 && editable && (
                    <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>{t('common.subtotal')}</p>
                        <p>
                          {currencyCode && (
                            <Price
                              priceWithTax={activeOrder?.subTotalWithTax ?? 0}
                              currencyCode={currencyCode}
                            />
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {t('cart.shippingMessage')}
                      </p>
                      {hasValidationIssue && (
                        <div className="mt-4 rounded-md bg-red-50 border border-red-100 p-3">
                          {/* <p className="text-sm font-semibold text-red-700">
                            Some items are unavailable.
                          </p>
                          {blockedLineSummaries.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm text-red-600 list-disc list-inside">
                              {blockedLineSummaries.map((item) => (
                                <li key={item.id}>
                                  {item.label}: {item.message}
                                </li>
                              ))}
                            </ul>
                          )} */}
                          <p className="mt-2 text-xs text-red-600">
                            Remove unavailable items from your cart to proceed
                            to checkout.
                          </p>
                        </div>
                      )}
                      <div className="mt-6">
                        {canCheckout ? (
                          <Link
                            to="/checkout"
                            onClick={() => onClose(false)}
                            className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-amber-800 hover:text-amber-800 hover:bg-white hover:border-amber-800 transition-colors"
                          >
                            {t('cart.checkout')}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex justify-center items-center w-full px-6 py-3 rounded-md border border-gray-200 text-base font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                            aria-disabled="true"
                          >
                            {t('cart.checkout')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
