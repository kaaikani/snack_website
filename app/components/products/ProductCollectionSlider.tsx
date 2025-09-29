import { Link } from '@remix-run/react';
import type {
  CurrencyCode,
  Product,
  ProductVariant,
  Asset,
  GetCollectionProductsBySlugQuery,
} from '~/generated/graphql';
import { ProductCard } from './ProductCard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getCollectionProductsBySlug } from '~/providers/customPlugins/customPlugin';

interface ProductCollectionSliderProps {
  collection?: {
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
  collectionSlug?: string;
  backgroundColor?: string;
  backgroundColorInner?: string;
  bannerUrl?: string;
}

export function ProductCollectionSlider({
  collection,
  activeOrderFetcher,
  activeOrder,
  isSignedIn,
  collectionSlug,
  backgroundColor,
  backgroundColorInner,
  bannerUrl,
}: ProductCollectionSliderProps) {
  const { t } = useTranslation();
  const [currentCollection, setCurrentCollection] =
    useState<ProductCollectionSliderProps['collection']>(collection);

  useEffect(() => {
    async function fetchCollection() {
      if (collectionSlug) {
        const fetchedCollection = await getCollectionProductsBySlug(
          collectionSlug,
        );
        if (fetchedCollection) {
          setCurrentCollection({
            id: fetchedCollection.id,
            name: fetchedCollection.name,
            slug: fetchedCollection.slug,
            featuredAsset: fetchedCollection.featuredAsset,
            products: Array.from(
              new Map(
                fetchedCollection.productVariants.items.map((item) => [
                  item.product.id,
                  {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    featuredAsset: item.product.featuredAsset,
                    variants: item.product.variants.map((variant) => ({
                      id: variant.id,
                      name: variant.name,
                      priceWithTax: variant.priceWithTax,
                      currencyCode: variant.currencyCode as CurrencyCode,
                      stockLevel: variant.stockLevel,
                      sku: variant.sku,
                    })),
                  },
                ]),
              ).values(),
            ),
          } as ProductCollectionSliderProps['collection']);
        } else {
          setCurrentCollection(undefined);
        }
      } else {
        setCurrentCollection(collection);
      }
    }
    fetchCollection();
  }, [collectionSlug, collection]);

  if (!currentCollection || currentCollection.products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        {/* <h2 className="text-xl sm:text-2xl font-medium text-gray-900">
          {currentCollection.name}
        </h2> */}
      </div>

      <div className="w-full mt-5 relative">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Banner"
            className="rounded-xl object-cover w-full h-64 sm:h-80 md:h-96"
          />
        )}
        <div
          className={`-top-8 relative z-10 ${backgroundColor} p-2 rounded-xl flex flex-col`}
        >
          {/* Collection Image Card */}
          {/* <div className="w-36 sm:w-[180px] md:w-[200px] mr-3 mt-2 flex-shrink-0">
            <Link
              to={`/collections/${currentCollection.slug}`}
              prefetch="intent"
              className="block relative"
            >
              <img
                className="rounded-xl object-cover aspect-[3/4.5] sm:aspect-[3/4]  w-full h-full"
                alt={currentCollection.name || ''}
                src={
                  currentCollection.featuredAsset?.preview
                    ? `${currentCollection.featuredAsset.preview}?w=400&h=400`
                    : '/placeholder.svg?height=400&width=400'
                }
              />
            </Link>
          </div> */}
          {/* Scrolling Product Cards */}
          <div
            className={`flex-1 overflow-x-auto shadow-inner ${backgroundColorInner} bg-red-200 rounded-xl p-2 scrollbar-none snap-x snap-mandatory px-3 sm:px-4`}
          >
            <div className="inline-flex gap-3 sm:gap-4 md:gap-6">
              {currentCollection.products.slice(0, 10).map((product) => (
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
          <div className="flex justify-end mr-2 pt-2">
            <Link to={`/collections/${currentCollection.slug}`}>
              <button className="p-[3px] relative">
                <div className="absolute inset-0 bg-[#FF6B6B]  rounded-xl" />
                <div className="px-4 py-1  bg-black rounded-[10px]  relative group transition duration-200 text-white hover:bg-transparent">
                  View More Products{' '}
                  <span aria-hidden="true" className="text-lg">
                    →
                  </span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
