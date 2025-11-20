'use client';
import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { Price } from './Price';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { CurrencyCode } from '~/generated/graphql';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { StockLevelLabel } from '~/components/products/StockLevelLabel'; // ✅ added
import { trackCustomEvent } from '~/utils/facebook-pixel';

export interface ActiveCustomer {
  activeCustomer?: {
    id: string;
    favorites?: {
      items: Array<{ product: { id: string } }>;
    };
  } | null;
}

type VariantOption = {
  name: string;
  group?: {
    name: string;
  } | null;
};

export interface ProductCardProps {
  productAsset: any;
  productName: string;
  slug: string;
  priceWithTax: any;
  currencyCode: CurrencyCode;
  shadowPrice?: number | null;
  variants?: Array<{
    id: string;
    name: string;
    featuredAsset?: { preview: string };
    priceWithTax: any;
    currencyCode: CurrencyCode;
    stockLevel?: string;
    sku?: string;
    options?: VariantOption[];
    customFields?: {
      shadowPrice?: number | null;
    };
  }>;
  productId: string;
  activeCustomer?: ActiveCustomer;
  activeOrderFetcher: any;
  activeOrder?: any;
  onFavoriteToggle?: (productId: string, isFavorited: boolean) => void;
  orderCount?: number;
  onShowSignInModal?: () => void;
}

export function ProductCard({
  productAsset,
  productName,
  slug,
  priceWithTax,
  currencyCode,
  variants = [],
  productId,
  activeCustomer,
  activeOrderFetcher,
  activeOrder,
  shadowPrice,
  onFavoriteToggle,
  orderCount,
  onShowSignInModal,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants?.[0]?.id || null,
  );
  const selectedVariant =
    variants?.find((v: any) => v.id === selectedVariantId) || null;

  const getVariantDropdownLabel = (variant: (typeof variants)[number]) => {
    const optionLabels =
      variant.options
        ?.map((option) => {
          const groupName = option.group?.name?.trim();
          const optionName = option.name?.trim();

          if (groupName && optionName) {
            return `${groupName}: ${optionName}`;
          }
          return optionName || groupName || '';
        })
        .filter(Boolean) ?? [];

    if (optionLabels.length) {
      return optionLabels.join(' • ');
    }

    return variant.name;
  };

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

  const currentPriceValue = extractPriceValue(
    selectedVariant?.priceWithTax ?? priceWithTax,
  );

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

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      setIsSignedIn(!!activeCustomer?.activeCustomer?.id);
    }
  }, [activeCustomer, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      const favorites = activeCustomer?.activeCustomer?.favorites;
      if (favorites?.items?.length) {
        const isFav = favorites.items.some((item) => {
          if (!item.product) return false;
          return item.product.id === productId;
        });
        setIsFavorited(isFav);
      } else {
        setIsFavorited(false);
      }
    }
  }, [activeCustomer, productId, isHydrated]);

  const qtyInCart =
    activeOrder?.lines.find(
      (l: any) => l.productVariant.id === selectedVariantId,
    )?.quantity ?? 0;

  // ✅ Define orderLine for +/- buttons
  const orderLine = activeOrder?.lines.find(
    (l: any) => l.productVariant.id === selectedVariantId,
  );

  const handleAdjustQty = (orderLineId: string, quantity: number) => {
    const formData = new FormData();
    formData.append('action', 'adjustItem');
    formData.append('lineId', orderLineId);
    formData.append('quantity', quantity.toString());

    activeOrderFetcher.submit(formData, {
      method: 'post',
      action: '/api/active-order',
    });
  };

  const handleShowSignInModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onShowSignInModal) {
      onShowSignInModal();
    } else {
      alert(t('product.signInToFavorite'));
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      alert(t('product.signInToFavorite'));
      return;
    }

    try {
      const response = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const data: any = await response.json();
      const updatedFavorites = data.items;
      const isNowFavorite = updatedFavorites.some(
        (item: any) => item.product.id === productId,
      );
      setIsFavorited(isNowFavorite);
      if (onFavoriteToggle) {
        onFavoriteToggle(productId, isNowFavorite);
      }
      // if (isNowFavorite) {
      //   trackPixelEvent('FavoriteAdded');
      // }
    } catch (error) {
      console.error('Favorite error:', error);
      alert(t('product.favoriteError'));
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!selectedVariantId) return;

    const formData = new FormData();
    formData.append('action', 'addItemToOrder');
    formData.append('variantId', selectedVariantId);
    formData.append('quantity', '1');

    // Track add to cart
    const variant = selectedVariant || variants[0];
    if (variant) {
      trackCustomEvent('AddToCart', {
        content_name: productName,
        content_ids: [selectedVariantId],
        content_type: 'product',
        value: variant.priceWithTax
          ? (variant.priceWithTax / 100).toFixed(2)
          : '0',
        currency: variant.currencyCode || 'USD',
        quantity: 1,
      });
    }

    activeOrderFetcher.submit(formData, {
      method: 'post',
      action: '/api/active-order',
    });
  };

  return (
    <div className="flex flex-col border rounded-xl p-2 relative bg-white shadow-sm">
      {discountPercent && discountPercent > 0 ? (
        <div className="absolute -top-[1px] left-2 z-10">
          <div className="inline-flex flex-col items-center bg-red-500 text-white rounded-b px-1 py-1">
            <span className="text-sm font-bold">{discountPercent}%</span>
            <span className="text-[12px] font-semibold tracking-wide">OFF</span>
          </div>
        </div>
      ) : null}
      <Link
        prefetch="intent"
        to={`/products/${slug}`}
        className="flex flex-col flex-1 relative"
      >
        <img
          className="rounded-xl flex-grow object-cover aspect-[7/5]"
          alt=""
          src={
            selectedVariant?.featuredAsset?.preview ||
            productAsset?.preview + '?w=300&h=400' ||
            '/placeholder.svg?height=400&width=300' ||
            '/placeholder.svg'
          }
        />

        {orderCount ? (
          <div className="absolute top-1 left-2 bg-[#E62727] text-white text-xs px-2 py-1 rounded-md shadow">
            {orderCount}+ Past Orders
          </div>
        ) : null}
      </Link>

      <div className="h-2" />

      {/* ✅ Product Name */}
      <div className="text-sm text-gray-700">{productName}</div>

      {/* ✅ Price */}
      <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Price
          priceWithTax={selectedVariant?.priceWithTax || priceWithTax}
          currencyCode={selectedVariant?.currencyCode || currencyCode}
        />
        {shouldShowShadowPrice ? (
          <span className="text-xs text-gray-500 mt-2 mr-2 line-through">
            <Price
              priceWithTax={shadowPriceValue ?? 0}
              currencyCode={selectedVariant?.currencyCode || currencyCode}
            />
          </span>
        ) : null}
        <StockLevelLabel stockLevel={selectedVariant?.stockLevel} />
      </div>

      {/* ✅ Variant Selector */}
      {variants && variants.length > 0 ? (
        <select
          className="mt-2 border rounded px-1 py-1 text-xs"
          value={selectedVariantId || ''}
          onChange={(event) => {
            event.stopPropagation();
            setSelectedVariantId(event.target.value);
          }}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {getVariantDropdownLabel(variant)}
            </option>
          ))}
        </select>
      ) : (
        <div className="mt-2 h-7" />
      )}

      {qtyInCart === 0 ? (
        <button
          type="button"
          className={`w-full text-white py-2 mt-1 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-md ${
            isSignedIn ? 'bg-amber-800  ' : 'bg-gray-400'
          }`}
          onClick={isSignedIn ? handleAddToCart : handleShowSignInModal}
        >
          {t('product.addToCart')}
        </button>
      ) : (
        <div className="flex mt-1 items-center justify-center w-full mx-auto rounded-lg">
          <button
            type="button"
            onClick={() =>
              orderLine &&
              handleAdjustQty(orderLine.id, Math.max(0, qtyInCart - 1))
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
              orderLine && handleAdjustQty(orderLine.id, qtyInCart + 1)
            }
            className="flex-1 rounded-2xl border text-[#FF6B6B] shadow-sm text-lg hover:bg-red-50 transition-colors duration-200"
          >
            +
          </button>
        </div>
      )}

      {/* ✅ Favorite Button */}
      {isHydrated && (
        <button
          type="button"
          className="absolute top-2 right-2 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100"
          onClick={handleToggleFavorite}
          title={isFavorited ? 'Remove Favorite' : 'Add Favorite'}
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutlineIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
}
