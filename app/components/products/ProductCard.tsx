'use client';

import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { Price, PriceRange } from './Price';
import {
  HeartIcon as HeartSolidIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { CurrencyCode, type Order, type OrderLine } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';
import { StockLevelLabel } from '~/components/products/StockLevelLabel';
import { SignInPromptModal } from '~/components/modal/SignInPromptModal';

export interface ActiveCustomer {
  activeCustomer?: {
    id: string;
    favorites?: {
      items: Array<{ product: { id: string } }>;
    };
  } | null;
}

export interface ProductCardProps {
  productAsset: { preview: string } | null;
  productName: string;
  slug: string;
  priceWithTax: number | PriceRange;
  currencyCode: CurrencyCode;
  variants?: Array<{
    id: string;
    name: string;
    featuredAsset?: { preview: string };
    priceWithTax: number;
    currencyCode: CurrencyCode;
    stockLevel?: string;
    sku?: string;
  }>;
  productId: string;
  activeCustomer?: ActiveCustomer;
  activeOrderFetcher: any;
  activeOrder?: Order | null;
  onFavoriteToggle?: (productId: string, isFavorited: boolean) => void;
  orderCount?: number;
  isSignedIn: boolean;
  showAsVariantCard?: boolean; // 👈 new prop
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
  onFavoriteToggle,
  orderCount,
  isSignedIn,
  showAsVariantCard = false, // 👈 default false
}: ProductCardProps) {
  const { t } = useTranslation();
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants?.[0]?.id || null,
  );
  const selectedVariant =
    variants?.find((v) => v.id === selectedVariantId) || null;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const favorites = activeCustomer?.activeCustomer?.favorites;
      if (favorites?.items?.length) {
        const isFav = favorites.items.some(
          (item) => item.product?.id === productId,
        );
        setIsFavorited(isFav);
      } else {
        setIsFavorited(false);
      }
    }
  }, [activeCustomer, productId, isHydrated]);

  const orderLine = activeOrder?.lines.find(
    (l: OrderLine) => l.productVariant.id === selectedVariantId,
  );
  const qtyInCart = orderLine?.quantity ?? 0;

  const handleAdjustQty = async (orderLineId: string, quantity: number) => {
    const formData = new FormData();
    formData.append('action', 'adjustItem');
    formData.append('lineId', orderLineId);
    formData.append('quantity', quantity.toString());
    activeOrderFetcher.submit(formData, {
      method: 'post',
      action: '/api/active-order',
    });
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
    } catch (error) {
      console.error('Favorite error:', error);
      alert(t('product.favoriteError'));
    }
  };

  const handleShowSignInModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignInModal(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }

    if (!selectedVariantId) return;

    const formData = new FormData();
    formData.append('action', 'addItemToOrder');
    formData.append('variantId', selectedVariantId);
    formData.append('quantity', '1');

    activeOrderFetcher.submit(formData, {
      method: 'post',
      action: '/api/active-order',
    });
  };

  return (
    <div className="flex flex-col border rounded-xl p-2 relative bg-white shadow-sm">
      <Link
        prefetch="intent"
        to={`/products/${slug}`}
        className="flex flex-col flex-1 relative"
      >
        <img
          className="rounded-xl flex-grow object-cover aspect-[7/5]"
          alt={productName}
          src={
            selectedVariant?.featuredAsset?.preview ||
            productAsset?.preview + '?w=300&h=400' ||
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
      <div className="text-sm text-gray-700 text-center font-medium">
        {productName}
      </div>

      {/* ✅ Price */}
      <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-2 mt-1">
        <Price
          priceWithTax={selectedVariant?.priceWithTax || priceWithTax}
          currencyCode={selectedVariant?.currencyCode || currencyCode}
        />
        <StockLevelLabel stockLevel={selectedVariant?.stockLevel} />
      </div>

      {/* ✅ Variant Selector (hidden if showAsVariantCard) */}
      {!showAsVariantCard && variants && variants.length > 1 ? (
        <select
          className="mt-2 border rounded px-1 py-1 text-xs"
          value={selectedVariantId || ''}
          onChange={(e) => setSelectedVariantId(e.target.value)}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="mt-2 h-7" />
      )}

      {/* ✅ Add to Cart */}
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

      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
      />
    </div>
  );
}
