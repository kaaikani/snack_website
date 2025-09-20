import { Link } from '@remix-run/react';
import type { CurrencyCode } from '~/generated/graphql';
import { ProductCard } from './ProductCard';
import { useTranslation } from 'react-i18next';

interface ProductCollectionSliderProps {
  collection: {
    id: string;
    name: string;
    slug: string;
    featuredAsset?: {
      id: string;
      preview: string;
    } | null;
    products: Array<{
      id: string;
      name: string;
      slug: string;
      featuredAsset?: {
        id: string;
        preview: string;
      } | null;
      variants: Array<{
        id: string;
        name: string;
        priceWithTax: number;
        currencyCode: CurrencyCode;
        stockLevel: string;
        sku: string;
      }>;
    }>;
  };
  activeOrderFetcher: any;
  activeOrder: any;
  isSignedIn: boolean;
}

export function ProductCollectionSlider({
  collection,
  activeOrderFetcher,
  activeOrder,
  isSignedIn,
}: ProductCollectionSliderProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-8 px-3 sm:px-6 lg:px-8 xl:mx-30">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900">
          {collection.name}
        </h2>
        <Link
          to={`/collections/${collection.slug}`}
          className="hidden sm:block text-sm font-semibold text-primary-600 hover:text-primary-500"
        >
          See More <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-4 relative flex">
        {/* Collection Image Card */}
        <div className="w-36 sm:w-[180px] md:w-[200px] mr-3 flex-shrink-0">
          <Link
            to={`/collections/${collection.slug}`}
            prefetch="intent"
            className="block relative"
          >
            <img
              className="rounded-xl object-cover aspect-[3/4.5] sm:aspect-[3/4]  w-full h-full"
              alt={collection.name}
              src={
                collection.featuredAsset?.preview
                  ? `${collection.featuredAsset.preview}?w=400&h=400`
                  : '/placeholder.svg?height=400&width=400'
              }
            />
          </Link>
        </div>
        {/* Scrolling Product Cards */}
        <div className="flex-1 overflow-x-auto scrollbar-none snap-x snap-mandatory px-3 sm:px-4">
          <div className="inline-flex gap-3 sm:gap-4 md:gap-6">
            {collection.products.slice(0, 10).map((product) => (
              <div
                key={product.id}
                className="w-36 sm:w-[180px] md:w-[200px] flex-shrink-0 snap-center"
              >
                <ProductCard
                  productId={product.id}
                  productName={product.name}
                  slug={product.slug}
                  currencyCode={product.variants[0].currencyCode}
                  priceWithTax={product.variants[0].priceWithTax}
                  productAsset={product.featuredAsset || null}
                  variants={product.variants}
                  activeOrderFetcher={activeOrderFetcher}
                  activeOrder={activeOrder}
                  isSignedIn={isSignedIn}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
