import React, { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import type { CurrencyCode } from '~/generated/graphql';
import { ProductCard } from './ProductCard';
import { getCollectionProductsBySlug } from '~/providers/customPlugins/customPlugin';

interface ProductCollectionSliderProps {
  collection?: {
    id: string;
    name: string;
    slug: string;
    featuredAsset?: { preview: string } | null;
    products: {
      id: string;
      name: string;
      slug: string;
      featuredAsset?: { preview: string } | null;
      variants: {
        id: string;
        name: string;
        priceWithTax: number;
        currencyCode: CurrencyCode;
        stockLevel: string;
        sku: string;
      }[];
    }[];
  };
  activeOrderFetcher: any;
  activeOrder: any;
  isSignedIn: boolean;
  collectionSlug?: string;
  backgroundColor?: string;
  bannerUrl?: string;
}

export function ProductCollectionSlider({
  collection,
  activeOrderFetcher,
  activeOrder,
  isSignedIn,
  collectionSlug,
  backgroundColor,
  bannerUrl,
}: ProductCollectionSliderProps) {
  const [currentCollection, setCurrentCollection] = useState<
    ProductCollectionSliderProps['collection']
  >(collection);

  useEffect(() => {
    async function fetchCollection() {
      if (collectionSlug) {
        const fetchedCollection = await getCollectionProductsBySlug(collectionSlug);
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
          });
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
  <div className="overflow-x-auto shadow-inner scrollbar-none snap-x snap-mandatory px-3 sm:px-4 pb-12">
    <div className="inline-flex gap-3 sm:gap-4 md:gap-6">
      {currentCollection.products.flatMap((product) =>
        product.variants.map((variant) => (
          <div
            key={variant.id}
            className="w-36 sm:w-[180px] md:w-[200px] flex-shrink-0 snap-center"
          >
            <ProductCard
              productId={product.id}
              productName={variant.name} // only variant name
              slug={product.slug}
              currencyCode={variant.currencyCode}
              priceWithTax={variant.priceWithTax}
              productAsset={product.featuredAsset || null}
              variants={[variant]}
              activeOrderFetcher={activeOrderFetcher}
              activeOrder={activeOrder}
              isSignedIn={isSignedIn}
              showAsVariantCard={true}
            />
          </div>
        )),
      )}
    </div>
  </div>

  {/* Fixed View More button */}
  <div className="absolute bottom-3 right-3">
    <Link to={`/collections/${currentCollection.slug}`}> 
      <button className="p-[3px] relative">
        <div className="absolute inset-0 bg-[#FF6B6B] rounded-xl" />
        <div className="px-4 py-1 bg-black rounded-[10px] relative group transition duration-200 text-white hover:bg-transparent">
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
  );
}