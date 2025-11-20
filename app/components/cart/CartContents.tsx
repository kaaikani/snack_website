import { Link } from '@remix-run/react';
import { Price } from '~/components/products/Price';
import { ActiveOrderQuery, CurrencyCode } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// const trackPixelEvent = (eventName: string) => {
//   if (typeof window === 'undefined') {
//     return;
//   }
//   if (typeof window.fbq === 'function') {
//     window.fbq('trackCustom', eventName);
//   }
// };

type UnavailableItemMap = Record<
  string,
  {
    reason?: string | null;
    productName?: string | null;
    variantName?: string | null;
  }
>;

function formatUnavailableReason(reason?: string | null): string {
  if (!reason) {
    return 'This item is currently unavailable.';
  }
  const normalized = reason.toUpperCase();
  switch (normalized) {
    case 'OUT_OF_STOCK':
    case 'INSUFFICIENT_STOCK':
    case 'NOT_ENOUGH_STOCK':
    case 'ORDER_LINE_OUT_OF_STOCK':
      return 'This item is out of stock.';
    case 'PRODUCT_DISABLED':
    case 'PRODUCT_VARIANT_DISABLED':
    case 'DISABLED':
      return 'This item is currently unavailable.';
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

function formatStockLabel(stockLevel?: string | null): string {
  switch (stockLevel) {
    case 'IN_STOCK':
      return 'In stock';
    case 'LOW_STOCK':
      return 'Low stock';
    case 'OUT_OF_STOCK':
      return 'Out of stock';
    default:
      return 'Stock status unavailable';
  }
}

export function CartContents({
  orderLines,
  currencyCode,
  editable = true,
  adjustOrderLine,
  removeItem,
  unavailableItemsByLineId,
}: {
  orderLines: NonNullable<ActiveOrderQuery['activeOrder']>['lines'];
  currencyCode: CurrencyCode;
  editable: boolean;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
  unavailableItemsByLineId?: UnavailableItemMap;
}) {
  const { t } = useTranslation();
  const isEditable = editable !== false;
  const [removingItems, setRemovingItems] = useState<string[]>([]);

  const handleQuantityChange = (lineId: string, delta: number) => {
    if (adjustOrderLine) {
      const line = orderLines.find((l) => l.id === lineId);
      if (line) {
        const newQuantity = Math.max(1, Math.min(50, line.quantity + delta));
        adjustOrderLine(lineId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (lineId: string) => {
    if (removeItem && !removingItems.includes(lineId)) {
      setRemovingItems((prev) => [...prev, lineId]);
      removeItem(lineId);
      // trackPixelEvent('RemoveitemFromCart');
    }
  };

  return (
    <div className="mt-6 flow-root">
      <ul role="list" className="space-y-4">
        {(orderLines ?? []).map((line) => {
          const unavailableEntry = unavailableItemsByLineId
            ? unavailableItemsByLineId[line.id]
            : undefined;
          const stockLevel = line.productVariant.stockLevel;
          const isOutOfStock = stockLevel === 'OUT_OF_STOCK';
          const isUnavailable = Boolean(unavailableEntry);

          let statusLabel: string | null = null;
          let statusClasses =
            'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm';

          if (isUnavailable) {
            statusLabel = 'Out of stock';
            statusClasses =
              'bg-red-100 text-red-700 border border-red-200 shadow-sm';
          } else {
            switch (stockLevel) {
              case 'OUT_OF_STOCK':
                statusLabel = 'Out of stock';
                statusClasses =
                  'bg-red-100 text-red-700 border border-red-200 shadow-sm';
                break;
              case 'LOW_STOCK':
                statusLabel = 'Low stock';
                statusClasses =
                  'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm';
                break;
              case 'IN_STOCK':
                statusLabel = 'In stock';
                statusClasses =
                  'bg-green-100 text-green-700 border border-green-200 shadow-sm';
                break;
              default:
                statusLabel = null;
            }
          }

          const isUnavailableVisual = isOutOfStock || isUnavailable;
          const displayStockLabel = isUnavailable
            ? 'Out of stock'
            : formatStockLabel(stockLevel);

          return (
            <li
              key={line.id}
              className={`relative flex gap-3 p-4 rounded-xl border ${
                isUnavailableVisual
                  ? 'border-red-100 bg-red-50/60'
                  : 'border-gray-200 bg-white'
              } shadow-sm transition-colors duration-200`}
            >
              <div
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ring-1 ${
                  isUnavailableVisual
                    ? 'opacity-60 ring-red-100'
                    : 'ring-gray-100'
                }`}
              >
                <img
                  src={line.featuredAsset?.preview + '?preset=thumb'}
                  alt={line.productVariant.name}
                  className={`w-full h-full object-center object-cover ${
                    isUnavailableVisual ? 'grayscale-[30%]' : ''
                  }`}
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <Link
                      to={`/products/${line.productVariant.product.slug}`}
                      className="text-sm font-semibold text-gray-900 leading-tight hover:text-gray-700"
                    >
                      {line.productVariant.name}
                    </Link>
                    <span
                      className={`mt-1 text-xs font-semibold uppercase tracking-wide ${
                        isUnavailable || isOutOfStock
                          ? 'text-red-600'
                          : stockLevel === 'LOW_STOCK'
                          ? 'text-amber-600'
                          : stockLevel === 'IN_STOCK'
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {displayStockLabel}
                    </span>
                  </div>

                  <div className="text-right text-sm font-semibold text-gray-900">
                    <Price
                      priceWithTax={line.linePriceWithTax}
                      currencyCode={currencyCode}
                    />
                  </div>
                </div>

                <div className="flex-1" />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div>
                    {editable && !isUnavailableVisual ? (
                      <div className="flex items-start border border-gray-200 rounded-lg overflow-hidden text-xs bg-gray-50">
                        <button
                          type="button"
                          disabled={!isEditable}
                          onClick={() => handleQuantityChange(line.id, -1)}
                          className="px-2.5 py-1 text-gray-700 hover:bg-white disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-3 py-1">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={!isEditable}
                          onClick={() => handleQuantityChange(line.id, 1)}
                          className="px-2.5 py-1 text-gray-700 hover:bg-white disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs pt-1 text-gray-500 items-start">
                        <span className="font-medium">Quantity</span>{' '}
                        <span>{line.quantity}</span>
                      </div>
                    )}
                  </div>

                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(line.id)}
                      disabled={removingItems.includes(line.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors justif pointer-events-auto"
                      title="Remove item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
