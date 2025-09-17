import { Form, Link } from '@remix-run/react';
import { Price } from '~/components/products/Price';
import { ActiveOrderQuery, CurrencyCode } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export function CartContents({
  orderLines,
  currencyCode,
  editable = true,
  adjustOrderLine,
  removeItem,
}: {
  orderLines: NonNullable<ActiveOrderQuery['activeOrder']>['lines'];
  currencyCode: CurrencyCode;
  editable: boolean;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
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
    }
  };

  return (
    <div className="mt-6 flow-root">
      <ul role="list" className="space-y-4">
        {(orderLines ?? []).map((line) => (
          <li key={line.id} className="flex p-4 bg-white rounded-xl shadow-lg">
            {/* Product image */}
            <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
              <img
                src={line.featuredAsset?.preview + '?preset=thumb'}
                alt={line.productVariant.name}
                className="w-full h-full object-center object-cover"
              />
            </div>

            {/* Product details */}
            <div className="ml-4 flex-1 flex flex-col justify-between">
              <div className="flex justify-between text-sm/8 font-medium text-gray-900">
                <h3>
                  <Link to={`/products/${line.productVariant.product.slug}`}>
                    {line.productVariant.name}
                  </Link>
                </h3>
                <Price
                  priceWithTax={line.linePriceWithTax}
                  currencyCode={currencyCode}
                />
              </div>

              <div className="flex items-center text-sm mt-2">
                {editable ? (
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => handleQuantityChange(line.id, -1)}
                      className="px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-4">{line.quantity}</span>
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => handleQuantityChange(line.id, 1)}
                      className="px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <span className="mr-1">Quantity</span>
                    <span className="font-medium">{line.quantity}</span>
                  </div>
                )}

                <div className="flex-1" />
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(line.id)}
                    disabled={removingItems.includes(line.id)}
                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Remove item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
