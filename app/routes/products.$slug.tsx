'use client';

import { type DataFunctionArgs, json } from '@remix-run/server-runtime';
import { useState, useEffect, useRef } from 'react';
import { Price } from '~/components/products/Price';
import { getProductBySlug } from '~/providers/products/products';
import {
  type FetcherWithComponents,
  type ShouldRevalidateFunction,
  useLoaderData,
  useOutletContext,
  type MetaFunction,
} from '@remix-run/react';
import {
  CheckIcon,
  PhotoIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { Breadcrumbs } from '~/components/Breadcrumbs';
import { APP_META_TITLE } from '~/constants';
import type { CartLoaderData } from '~/routes/api.active-order';
import { getSessionStorage } from '~/sessions';
import { ErrorCode, type ErrorResult } from '~/generated/graphql';
import Alert from '~/components/Alert';
import { StockLevelLabel } from '~/components/products/StockLevelLabel';
import { ScrollableContainer } from '~/components/products/ScrollableContainer';
import { useTranslation } from 'react-i18next';
import { getCollections } from '~/providers/collections/collections';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useActiveOrder } from '~/utils/use-active-order';
import { Dialog } from '@headlessui/react';
import { RecentOrders } from './RecentOrders';
import { getFrequentlyOrderedProducts } from '~/providers/customPlugins/customPlugin';
import { trackCustomEvent } from '~/utils/facebook-pixel';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data?.product?.name
        ? `${data.product.name} - ${APP_META_TITLE}`
        : APP_META_TITLE,
    },
  ];
};

export async function loader({ params, request }: DataFunctionArgs) {
  const { product } = await getProductBySlug(params.slug!, { request });
  if (!product) {
    throw new Response('Not Found', { status: 404 });
  }

  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request?.headers.get('Cookie'),
  );
  const error = session.get('activeOrderError');
  const collections = await getCollections(request, { take: 20 });
  const activeCustomer = await getActiveCustomer({ request });

  const loyaltyPoints =
    activeCustomer.activeCustomer?.customFields?.loyaltyPointsAvailable ?? null;

  const frequentlyOrdered = await getFrequentlyOrderedProducts({ request });

  return json(
    {
      product: product!,
      error,
      collections,
      activeCustomer,
      loyaltyPoints,
      frequentlyOrdered,
    },
    {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    },
  );
}

export const shouldRevalidate: ShouldRevalidateFunction = () => true;

export default function ProductSlug() {
  const {
    product,
    error,
    collections,
    activeCustomer,
    loyaltyPoints,
    frequentlyOrdered,
  } = useLoaderData<typeof loader>();

  const { activeOrderFetcher } = useOutletContext<{
    activeOrderFetcher: FetcherWithComponents<CartLoaderData>;
  }>();
  const { activeOrder } = activeOrderFetcher.data ?? {};
  const addItemToOrderError = getAddItemToOrderError(error);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(
    !!activeCustomer?.activeCustomer?.id,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const { adjustOrderLine, removeItem, refresh } = useActiveOrder();

  const handleAdjustQty = async (orderLineId: string, quantity: number) => {
    await adjustOrderLine(orderLineId, quantity);
    activeOrderFetcher.load('/api/active-order');
  };

  const handleRemoveItem = async (orderLineId: string) => {
    await removeItem(orderLineId);
    activeOrderFetcher.load('/api/active-order');
  };

  // ✅ Favorited state (keep only once)
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = activeCustomer?.activeCustomer?.favorites;
    if (favorites?.items?.length) {
      const isFav = favorites.items.some((item) => {
        if (!item.product) return false;
        return item.product.id === product.id;
      });
      setIsFavorited(isFav);
    }
  }, [activeCustomer, product.id]);

  const handleToggleFavorite = async () => {
    if (!isSignedIn) {
      alert(t('product.signInToFavorite'));
      return;
    }
    try {
      const response = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      const data = (await response.json()) as {
        items: { product: { id: string } }[];
      };
      const updatedFavorites = data.items;
      const isNowFavorite = updatedFavorites.some(
        (item: { product: { id: string } }) => item.product.id === product.id,
      );
      setIsFavorited(isNowFavorite);
    } catch (error) {
      console.error('Favorite error:', error);
      alert(t('product.favoriteError'));
    }
  };

  useEffect(() => {
    setIsSignedIn(!!activeCustomer?.activeCustomer?.id);
  }, [activeCustomer]);

  useEffect(() => {
    refresh();
  }, []);

  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0].id,
  );

  const findVariantById = (id: string) =>
    product.variants.find((v) => v.id === id);

  const selectLabelText =
    product.variants[0]?.options?.[0]?.group?.name || t('product.selectOption');

  const getVariantOptionLabel = (
    variant: (typeof product.variants)[number],
  ) => {
    const optionLabels =
      variant.options
        ?.map((option) => {
          const optionName = option.name?.trim();

          if (optionName) {
            return optionName;
          }
          return '';
        })
        .filter(Boolean) ?? [];

    if (optionLabels.length) {
      return optionLabels.join(' • ');
    }

    return variant.name;
  };

  const selectedVariant = findVariantById(selectedVariantId);

  useEffect(() => {
    if (!selectedVariant) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [selectedVariant, product.variants]);

  const extractPriceValue = (price?: any): number | null => {
    if (price == null) return null;
    if (typeof price === 'number') return price;
    if (typeof price === 'object') {
      if ('value' in price && typeof price.value === 'number') {
        return price.value;
      }
      if ('min' in price && typeof price.min === 'number') {
        return price.min;
      }
    }
    return null;
  };

  const qtyInCart =
    activeOrder?.lines.find((l) => l.productVariant.id === selectedVariantId)
      ?.quantity ?? 0;

  // ✅ Define orderLine for +/- buttons
  const orderLine = activeOrder?.lines.find(
    (l) => l.productVariant.id === selectedVariantId,
  );

  const handleShowSignInModal = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(t('product.signInToFavorite'));
  };

  const currentPriceValue = extractPriceValue(selectedVariant?.priceWithTax);
  const shadowPriceRaw = selectedVariant?.customFields?.shadowPrice;
  const shadowPriceValue =
    typeof shadowPriceRaw === 'number'
      ? shadowPriceRaw * 100
      : extractPriceValue(shadowPriceRaw);
  const shouldShowShadowPrice =
    shadowPriceValue != null &&
    currentPriceValue != null &&
    shadowPriceValue > currentPriceValue;

  const discountPercent =
    shouldShowShadowPrice && shadowPriceValue && currentPriceValue
      ? Math.round(
          ((shadowPriceValue - currentPriceValue) / shadowPriceValue) * 100,
        )
      : null;

  const [featuredAsset, setFeaturedAsset] = useState(
    selectedVariant?.featuredAsset,
  );

  const [isAppLeavingz, setIsAppLeaving] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState('We are currently closed.');
  const [leaveTitle, setLeaveTitle] = useState('Sorry for the inconvenience');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 py-4 min-h-screen sm:py-6">
        <Breadcrumbs
          items={
            product.collections[product.collections.length - 1]?.breadcrumbs ??
            []
          }
        />
        <div className="mt-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Image Section */}
            <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md flex flex-col">
              <div className="relative w-full ">
                <img
                  src={
                    (featuredAsset?.preview || product.featuredAsset?.preview) +
                    '?w=800'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {product.assets.length > 1 && (
                <div className="mt-4">
                  <ScrollableContainer>
                    {product.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`basis-1/3 flex-shrink-0 select-none touch-pan-x rounded-lg cursor-pointer ${
                          featuredAsset?.id === asset.id
                            ? 'border-2 border-primary-500'
                            : 'border border-gray-200'
                        }`}
                        onClick={() => setFeaturedAsset(asset)}
                      >
                        <img
                          draggable="false"
                          className="rounded-lg h-20 w-full object-cover"
                          src={
                            asset.preview + '?preset=full' || '/placeholder.svg'
                          }
                        />
                      </div>
                    ))}
                  </ScrollableContainer>
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-4">
                    {product.name}
                  </h2>
                  <button
                    type="button"
                    className="p-3 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                    onClick={handleToggleFavorite}
                    title={
                      isFavorited
                        ? t('product.removeFavorite')
                        : t('product.addFavorite')
                    }
                  >
                    {isFavorited ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartOutlineIcon className="w-6 h-6 text-gray-500" />
                    )}
                  </button>
                </div>
                <div
                  className="text-base text-gray-700 mb-4"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-semibold text-gray-900">
                      <Price
                        priceWithTax={selectedVariant?.priceWithTax}
                        currencyCode={selectedVariant?.currencyCode}
                      />
                    </span>
                    {discountPercent && discountPercent > 0 ? (
                      <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                        {discountPercent}% Off
                      </span>
                    ) : null}
                  </div>
                  {shouldShowShadowPrice ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-2">
                      <span className="font-medium">M.R.P:</span>
                      <span className="line-through text-gray-500">
                        <Price
                          priceWithTax={shadowPriceValue ?? 0}
                          currencyCode={selectedVariant?.currencyCode}
                        />
                      </span>
                      <span className="text-gray-500">
                        (Incl. of all taxes)
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="flex mt-1 flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                  <span className="font-medium">
                    SKU:{' '}
                    <span className="font-normal">{selectedVariant?.sku}</span>
                  </span>
                  <StockLevelLabel stockLevel={selectedVariant?.stockLevel} />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <activeOrderFetcher.Form
                      method="post"
                      action="/api/active-order"
                      ref={formRef}
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="addItemToOrder"
                      />
                      {product.variants.length > 1 ? (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {selectLabelText}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {product.variants.map((variant) => (
                              <button
                                key={variant.id}
                                type="button"
                                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200 ${
                                  selectedVariantId === variant.id
                                    ? 'bg-amber-800 text-white border-amber-800'
                                    : 'bg-white text-amber-800 border-amber-800'
                                }`}
                                onClick={() => {
                                  setSelectedVariantId(variant.id);
                                  setFeaturedAsset(variant.featuredAsset);
                                }}
                              >
                                {getVariantOptionLabel(variant)}
                                <input
                                  type="radio"
                                  name="variantId"
                                  value={variant.id}
                                  checked={selectedVariantId === variant.id}
                                  className="hidden"
                                  readOnly
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <input
                          type="hidden"
                          name="variantId"
                          value={selectedVariantId}
                        />
                      )}

                      {/* ✅ Add-to-Cart or Stepper UI (same as ProductCard) */}
                      {qtyInCart === 0 ? (
                        <button
                          type="button"
                          className={`w-full text-white py-2 mt-1 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-md ${
                            isSignedIn ? 'bg-amber-800  ' : 'bg-gray-400'
                          }`}
                          onClick={
                            isSignedIn
                              ? () => {
                                  // Track add to cart
                                  const variant =
                                    selectedVariant || product.variants[0];
                                  trackCustomEvent('AddToCart', {
                                    content_name: product.name,
                                    content_ids: [variant.id],
                                    content_type: 'product',
                                    value: variant.priceWithTax
                                      ? (variant.priceWithTax / 100).toFixed(2)
                                      : '0',
                                    currency: variant.currencyCode || 'INR',
                                    quantity: 1,
                                  });
                                  formRef.current?.requestSubmit();
                                }
                              : handleShowSignInModal
                          }
                        >
                          {t('product.addToCart')}
                        </button>
                      ) : (
                        <div className="flex mt-1 items-center justify-center w-full mx-auto rounded-lg">
                          <button
                            type="button"
                            onClick={() =>
                              orderLine &&
                              handleAdjustQty(
                                orderLine.id,
                                Math.max(0, qtyInCart - 1),
                              )
                            }
                            className="flex-1 rounded-2xl border text-[#FF6B6B] shadow-sm text-lg hover:bg-red-50 transition-colors duration-200"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center py-1 text-sm font-semibold text-blue-800">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              orderLine &&
                              handleAdjustQty(orderLine.id, qtyInCart + 1)
                            }
                            className="flex-1 rounded-2xl border text-[#FF6B6B] shadow-sm text-lg hover:bg-red-50 transition-colors duration-200"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {addItemToOrderError && (
                        <div className="mt-4">
                          <Alert message={addItemToOrderError} />
                        </div>
                      )}
                    </activeOrderFetcher.Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Use frequentlyOrdered here */}
      <RecentOrders
        products={frequentlyOrdered}
        activeCustomer={activeCustomer}
        activeOrderFetcher={activeOrderFetcher}
        activeOrder={activeOrder}
      />
    </div>
  );
}

export function CatchBoundary() {
  const { t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-gray-900 my-8">
        {t('product.notFound')}
      </h2>
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start mt-4 md:mt-12">
        <div className="w-full max-w-2xl mx-auto sm:block lg:max-w-none">
          <span className="rounded-md overflow-hidden">
            <div className="w-full h-96 bg-slate-200 rounded-lg flex content-center justify-center">
              <PhotoIcon className="w-48 text-white" />
            </div>
          </span>
        </div>
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <div className="">{t('product.notFoundInfo')}</div>
          <div className="flex-1 space-y-3 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAddItemToOrderError(error?: ErrorResult): string | undefined {
  if (!error || !error.errorCode) return undefined;

  switch (error.errorCode) {
    case ErrorCode.OrderModificationError:
    case ErrorCode.OrderLimitError:
    case ErrorCode.NegativeQuantityError:
    case ErrorCode.InsufficientStockError:
      return error.message;
  }
}
