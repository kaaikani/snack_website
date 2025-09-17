'use client';

import { useState } from 'react';
import { Button } from '~/components/Button';
import { Price } from '~/components/products/Price';
import { CurrencyCode } from '~/generated/graphql';
import { OrderStateBadge } from '~/components/account/OrderStateBadge';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useFetcher } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { ConfirmationDialog } from '~/components/ConfirmationDialog';

// Define types that match exactly what comes from your GraphQL query
type FulfillmentLine = {
  __typename?: 'FulfillmentLine';
  quantity: number;
  fulfillment: {
    id: string;
    state: string;
    updatedAt: string;
    trackingCode?: string;
  };
};

type Asset = {
  __typename?: 'Asset';
  id: string;
  source: string;
  preview: string;
};

type OrderLine = {
  __typename?: 'OrderLine';
  id?: string; // Make optional if not always present
  quantity: number;
  discountedLinePriceWithTax: number;
  discountedUnitPriceWithTax: number;
  fulfillmentLines?: FulfillmentLine[] | null;
  featuredAsset?: Asset | null;
  productVariant: {
    __typename?: 'ProductVariant';
    id: string;
    name: string;
    currencyCode: string;
    product: {
      __typename?: 'Product';
      slug: string;
    };
  };
  // Add these as optional since they might not be in the response
  unitPrice?: number;
  unitPriceWithTax?: number;
  linePriceWithTax?: number;
  discounts?: Array<{
    amount: number;
    amountWithTax: number;
    description: string;
  }>;
};

type OrderDiscount = {
  amount: number;
  amountWithTax: number;
  description: string;
  adjustmentSource?: string;
  type?: string;
};

type ShippingLine = {
  priceWithTax: number;
  shippingMethod: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
};

type Fulfillment = {
  id: string;
  state: string;
  trackingCode?: string;
  updatedAt: string;
};

// Updated Order type to match your GraphQL response exactly
type Order = {
  __typename?: 'Order';
  id: string;
  code: string;
  state: string;
  active?: boolean;
  orderPlacedAt?: string;
  currencyCode: string;
  subTotal: number;
  subTotalWithTax: number;
  total: number;
  totalWithTax: number;
  shipping?: number;
  shippingWithTax?: number;
  lines: OrderLine[];
  discounts: OrderDiscount[];
  taxSummary?: Array<{
    taxBase: number;
    taxTotal: number;
  }>;
  shippingLines: ShippingLine[];
  fulfillments?: Fulfillment[];
  customFields?: {
    clientRequestToCancel?: number;
    otherInstructions?: string;
  };
};

type OrderHistoryItemProps = {
  order: Order;
  isInitiallyExpanded?: boolean;
  areDetailsInitiallyExpanded?: boolean;
  className?: string;
};

export default function OrderHistoryItem({
  order,
  isInitiallyExpanded = false,
  areDetailsInitiallyExpanded = false,
  className = '',
}: OrderHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isInitiallyExpanded);
  const [areDetailsExpanded, setAreDetailsExpanded] = useState<boolean>(
    areDetailsInitiallyExpanded,
  );
  const [isLineCalcExpanded, setIsLineCalcExpanded] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const { t } = useTranslation();
  const fetcher = useFetcher();

  // Check if order can be cancelled (not already cancelled, delivered, etc.)
  const canCancelOrder =
    order?.state &&
    !['Cancelled', 'Delivered', 'Shipped'].includes(order.state);

  // Check if cancel request is already pending
  const hasPendingCancelRequest =
    order?.customFields?.clientRequestToCancel || false;

  const handleCancelOrder = () => {
    if (!order?.id || !order?.totalWithTax) return;

    const formData = new FormData();
    formData.append('intent', 'cancel-order');
    formData.append('orderId', order.id);
    formData.append('value', '1');

    fetcher.submit(formData, { method: 'post' });
    setShowCancelDialog(false);
  };

  const shipping = order.shippingWithTax ?? 0;

  // Show success/error messages
  const isSubmitting = fetcher.state === 'submitting';
  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {actionData && (
        <div
          className={`p-3 text-sm ${
            actionData.success
              ? 'bg-green-50 text-green-800 border-b border-green-200'
              : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}
        >
          {actionData.message}
        </div>
      )}

      {/* Upper Summary */}
      <div className="p-4 lg:p-6 flex flex-row justify-between items-center bg-gray-50 border-b">
        {/* Infos */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 text-sm">
          {/* Info - Date */}
          <div>
            <span className="block font-medium">{t('order.placedAt')}</span>
            <span
              className="text-gray-500"
              title={
                order.orderPlacedAt
                  ? new Date(order.orderPlacedAt).toLocaleString()
                  : ''
              }
            >
              {order.orderPlacedAt
                ? new Date(order.orderPlacedAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '--'}
            </span>
          </div>
          {/* Info - Total sum */}
          <div>
            <span className="block font-medium">{t('order.totalSum')}</span>
            <span className="text-gray-500">
              {order.totalWithTax != null &&
              order.currencyCode &&
              Object.values(CurrencyCode).includes(
                order.currencyCode as CurrencyCode,
              ) ? (
                <Price
                  priceWithTax={order.totalWithTax}
                  currencyCode={order.currencyCode as CurrencyCode}
                />
              ) : (
                '--'
              )}
            </span>
          </div>
          {/* Info - Order number */}
          <div>
            <span className="block font-medium">{t('order.number')}</span>
            <span className="text-gray-500">{order.code || '--'}</span>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="gap-4 lg:gap-6 flex flex-col items-end self-stretch justify-between md:flex-row md:items-center">
          <div className="flex flex-col items-end gap-2">
            <OrderStateBadge state={order.state} />
            {hasPendingCancelRequest && order.state !== 'Cancelled' && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Cancel request pending
              </span>
            )}
          </div>
          <div className="flex" role="group">
            {/* <Button title={t("order.actionsMessage")} className="bg-white text-sm rounded-r-none border-r-0">
              <span className="text-xs hidden">{t("order.actions")}</span>
              <EllipsisVerticalIcon className="w-5 h-5" />
            </Button> */}
            <Button
              className="bg-white text-sm rounded-l-none"
              onClick={() => setIsExpanded(!isExpanded)}
              title={t('order.expand')}
            >
              <ChevronRightIcon
                className={`w-5 h-5 transition-transform duration-100 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsable details */}
      {isExpanded && (
        <div className="flex flex-col">
          {order.lines.map((line, key) => (
            <div
              key={line.id || key}
              className="p-4 lg:p-6 border-b flex flex-row gap-8 justify-between group"
            >
              {/* Product */}
              <div className="inline-flex justify-center items-center gap-4">
                <Link
                  to={`/products/${line.productVariant.product.slug}`}
                  className="hover:opacity-50 transition-opacity"
                >
                  <img
                    src={
                      line.featuredAsset?.source ||
                      '/placeholder.svg?height=96&width=96'
                    }
                    alt={line.productVariant.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                </Link>
                <span className="flex flex-1 flex-col gap-0">
                  {/* Product name */}
                  <Link
                    to={`/products/${line.productVariant.product.slug}`}
                    className="text-black text-sm font-semibold line-clamp-3 md:line-clamp-2 max-w-md hover:text-black/50"
                    title={line.productVariant.name}
                  >
                    {line.productVariant.name}
                  </Link>
                  {/* Price and quantity */}
                  <button
                    className="inline-flex gap-2 items-center w-fit text-gray-500 text-sm mt-1"
                    onClick={() => setIsLineCalcExpanded(!isLineCalcExpanded)}
                  >
                    {isLineCalcExpanded && (
                      <>
                        <span title={t('common.quantity')}>
                          {line.quantity}
                        </span>
                        <span className="text-gray-300 select-none">×</span>
                        <span title="Price per unit">
                          {line.discountedUnitPriceWithTax != null &&
                          line.productVariant.currencyCode &&
                          Object.values(CurrencyCode).includes(
                            line.productVariant.currencyCode as CurrencyCode,
                          ) ? (
                            <Price
                              priceWithTax={line.discountedUnitPriceWithTax}
                              currencyCode={
                                line.productVariant.currencyCode as CurrencyCode
                              }
                            />
                          ) : (
                            '--'
                          )}
                        </span>
                        <span className="text-gray-300 select-none">=</span>
                      </>
                    )}
                    <span title="Subtotal">
                      {line.discountedLinePriceWithTax != null &&
                      line.productVariant.currencyCode &&
                      Object.values(CurrencyCode).includes(
                        line.productVariant.currencyCode as CurrencyCode,
                      ) ? (
                        <Price
                          priceWithTax={line.discountedLinePriceWithTax}
                          currencyCode={
                            line.productVariant.currencyCode as CurrencyCode
                          }
                        />
                      ) : (
                        '--'
                      )}
                    </span>
                  </button>
                  {/* Shipment status */}
                  <span className="text-gray-500 text-xs mt-2 tracking-wide">
                    {!line.fulfillmentLines ||
                    line.fulfillmentLines.reduce(
                      (acc, fLine) => acc + fLine.quantity,
                      0,
                    ) === 0
                      ? t('order.notShipped')
                      : `${line.fulfillmentLines.reduce(
                          (acc, fLine) => acc + fLine.quantity,
                          0,
                        )} ${t('common.or')} ${line.quantity} ${t(
                          'order.items.fulfilled',
                        )}`}
                    {line.fulfillmentLines
                      ?.filter((fLine) => fLine.quantity > 0)
                      .map((fLine, index) => (
                        <span
                          key={fLine.fulfillment.id || index}
                          className="block first:mt-2"
                          title={
                            fLine.fulfillment.updatedAt
                              ? new Date(
                                  fLine.fulfillment.updatedAt,
                                ).toLocaleString()
                              : ''
                          }
                        >
                          {fLine.fulfillment.state}:{' '}
                          {fLine.fulfillment.updatedAt
                            ? new Intl.DateTimeFormat(undefined, {
                                dateStyle: 'medium',
                              }).format(new Date(fLine.fulfillment.updatedAt))
                            : 'N/A'}
                        </span>
                      ))}
                  </span>
                </span>
              </div>
            </div>
          ))}

          {/* Per order actions */}
          <div className="p-2 lg:py-3 lg:px-6 gap-2 lg:gap-6 grid grid-cols-2 sm:flex justify-end items-center">
            {order.fulfillments?.map((fulfillment, index) => (
              <Button
                key={fulfillment.id || index}
                onClick={() =>
                  alert(
                    `${t('trackAlert')} "${fulfillment.trackingCode || 'N/A'}"`,
                  )
                }
                className="text-xs"
              >
                {/* Only show package number if there are more than one: Looks cleaner */}
                {t('order.trackPackage')}{' '}
                {(order.fulfillments?.length || 0) === 1 ? '' : `#${index + 1}`}
              </Button>
            ))}
            {canCancelOrder && !hasPendingCancelRequest && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                className="bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white text-xs order-1 sm:order-none"
                title="Cancel Order"
                disabled={isSubmitting}
              >
                <span>Cancel</span>
              </Button>
            )}
            <Button
              onClick={() => setAreDetailsExpanded(!areDetailsExpanded)}
              className="col-start-2 order-2 sm:order-none"
            >
              <span className="text-xs">{t('order.detailedOverview')}</span>
              <ChevronRightIcon
                className={`w-5 h-5 transition-transform duration-100 ${
                  areDetailsExpanded ? 'rotate-90' : ''
                }`}
              />
            </Button>
          </div>

          {/* More details - Could be expanded with shipping addresses, payment option, etc. */}
          {areDetailsExpanded && (
            <div className="p-2 lg:p-3 grid grid-cols-2 gap-1 text-sm max-w-sm self-center md:self-end">
              <h6 className="font-medium col-span-full">
                {t('order.summary')}
              </h6>
              <span>Subtotal</span>
              <span className="text-end">
                {(() => {
                  const subtotal = order.lines.reduce(
                    (acc, line) => acc + (line.discountedLinePriceWithTax ?? 0),
                    0,
                  );
                  return (
                    <Price
                      priceWithTax={subtotal}
                      currencyCode={order.currencyCode as CurrencyCode}
                    />
                  );
                })()}
              </span>

              <span>Shipping</span>
              <span className="text-end">
                <Price
                  priceWithTax={shipping}
                  currencyCode={order.currencyCode as CurrencyCode}
                />
              </span>

              <span>Coupon & Discount</span>
              <span className="text-end text-red-600">
                {(() => {
                  const subtotal = order.lines.reduce(
                    (acc, line) => acc + (line.discountedLinePriceWithTax ?? 0),
                    0,
                  );
                  const shippingVal = shipping;
                  const total = order.totalWithTax ?? 0;
                  const discount = subtotal + shippingVal - total;
                  const hasDiscount =
                    order.discounts &&
                    order.discounts.length > 0 &&
                    discount > 0;
                  if (hasDiscount) {
                    return (
                      <>
                        -
                        <Price
                          priceWithTax={discount}
                          currencyCode={order.currencyCode as CurrencyCode}
                        />
                      </>
                    );
                  } else {
                    return '--';
                  }
                })()}
              </span>

              <span className="font-medium">Total</span>
              <span className="font-medium text-end">
                <Price
                  priceWithTax={order.totalWithTax ?? 0}
                  currencyCode={order.currencyCode as CurrencyCode}
                />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${order.code}? This action will submit a cancellation request that requires admin approval.`}
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        isLoading={isSubmitting}
      />
    </div>
  );
}
