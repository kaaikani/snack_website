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
}

export function ProductCollectionSlider({
  collection,
  activeOrderFetcher,
  activeOrder,
}: ProductCollectionSliderProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-10 px-4 sm:px-6 lg:px-8 xl:max-w-7xl xl:mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-gray-900">
          {collection.name}
        </h2>
        {/* <Link
          to={`/collections/${collection.slug}`}
          className="hidden sm:block text-sm font-semibold text-primary-600 hover:text-primary-500"
        >
          {t("common.seeMore")} <span aria-hidden="true">→</span>
        </Link> */}
      </div>

      <div className="mt-6 relative flex">
        {/* ✅ Fixed Collection Image Card */}
        <div className="w-[160px] sm:w-[200px] md:w-[220px] mr-3 flex-shrink-0">
          <Link
            to={`/collections/${collection.slug}`}
            prefetch="intent"
            className="block relative"
          >
            <img
              className="rounded-xl object-cover aspect-[7/9.3] w-full h-full"
              alt={collection.name}
              src={
                collection.featuredAsset?.preview
                  ? collection.featuredAsset.preview + '?w=400&h=400'
                  : '/placeholder.svg?height=400&width=400'
              }
            />
            {/* gradient overlay */}
            {/* <span
            aria-hidden="true"
            className="absolute w-full bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl"
          /> */}
            {/* text */}
            {/* <span className="absolute bottom-2 w-full text-center text-sm font-medium text-white">
            {collection.name}
          </span> */}
          </Link>
        </div>

        {/* ✅ Scrolling Product Cards */}
        <div className="flex-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-4 md:gap-6">
            {collection.products.map((product) => (
              <div
                key={product.id}
                className="w-[160px] sm:w-[200px] md:w-[220px] flex-shrink-0"
              >
                <ProductCard
                  productId={product.id}
                  productName={product.name}
                  slug={product.slug}
                  currencyCode={product.variants[0].currencyCode}
                  priceWithTax={product.variants[0].priceWithTax}
                  productAsset={product.featuredAsset}
                  variants={product.variants}
                  activeOrderFetcher={activeOrderFetcher}
                  activeOrder={activeOrder}
                />
              </div>
            ))}
          </div>
          {/* right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white pointer-events-none" />
        </div>
      </div>

      <Link
        to={`/collections/${collection.slug}`}
        className="mt-4 block sm:hidden text-sm font-semibold text-primary-600 hover:text-primary-500"
      >
        {t('common.seeMore')} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
