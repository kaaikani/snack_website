import { useLoaderData, useOutletContext } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getCollections } from '~/providers/collections/collections';
import { getCustomBanners } from '~/providers/customPlugins/customPlugin';
import type { CurrencyCode, CustomBannersQuery } from '~/generated/graphql';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { ThreeLayoutBanner } from '~/components/ThreeLayoutBanner';
import { useTranslation } from 'react-i18next';
import ContentSection from '~/components/ContentSection';
import { ProductCollectionSlider } from '~/components/products/ProductCollectionSlider';
import { search } from '~/providers/products/products';

export async function loader({ request }: LoaderFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });

  let banners: CustomBannersQuery['customBanners'] = [];

  try {
    // Always use your fixed channel token
    const bannersResponse = await getCustomBanners(request, 'ind-snacks');
    banners = bannersResponse ? bannersResponse.data : [];
  } catch (error) {
    console.error('Error fetching banners:', error);
  }

  // Fetch products for each collection
  const collectionsWithProducts = await Promise.all(
    collections.map(async (collection) => {
      const searchResults = await search(
        {
          input: {
            take: 12,
            groupByProduct: true,
            term: '',
            collectionId: collection.id,
            inStock: true,
          },
        },
        { request },
      );

      const searchItems = await Promise.all(
        searchResults.search.items.map(async (item) => {
          const { product } = await import(
            '~/providers/products/products'
          ).then((m) => m.getProductBySlug(item.slug, { request }));

          return {
            id: item.productId,
            name: item.productName,
            slug: item.slug,
            featuredAsset: item.productAsset,
            variants: product?.variants?.map((variant) => ({
              id: variant.id,
              name: variant.name,
              priceWithTax: variant.priceWithTax,
              currencyCode: variant.currencyCode as CurrencyCode,
              stockLevel: variant.stockLevel,
              sku: variant.sku,
              featuredAsset: variant.featuredAsset
                ? {
                    preview: variant.featuredAsset.preview,
                  }
                : undefined,
            })) || [
              {
                id: item.productId,
                name: item.productName,
                priceWithTax:
                  typeof item.priceWithTax === 'object'
                    ? 'value' in item.priceWithTax
                      ? item.priceWithTax.value
                      : 'min' in item.priceWithTax
                      ? item.priceWithTax.min
                      : 0
                    : item.priceWithTax || 0,
                currencyCode: item.currencyCode as CurrencyCode,
                stockLevel: 'IN_STOCK',
                sku: item.productId,
                featuredAsset: item.productAsset
                  ? {
                      preview: item.productAsset.preview,
                    }
                  : undefined,
              },
            ],
          };
        }),
      );

      return {
        ...collection,
        products: searchItems,
      };
    }),
  );

  return json({
    collections: collectionsWithProducts,
    banners,
  });
}

type OutletContext = {
  activeOrderFetcher: any;
  activeOrder: any;
  adjustOrderLine: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
};

export default function Index() {
  const { collections, banners } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { activeOrderFetcher, activeOrder } = useOutletContext<OutletContext>();

  return (
    <>
      {/* Categories Section */}
      <section aria-labelledby="category-heading" className="pt-[90px]">
        {banners && banners.length >= 3 && (
          <section className="mt-3 mb-8 xl:mb-5 px-2 sm:px-3 lg:px-4">
            <ThreeLayoutBanner banners={banners} />
          </section>
        )}

        <div className="text-center my-10">
          <h1 className="text-5xl font-semibold uppercase text-gray-800">
            Sweet Treats
          </h1>
          <h2 className="text-lg italic font-normal text-gray-600 mt-1">
            Indulgent Desserts and Candies
          </h2>
        </div>

        <div className="mt-4">
          <div className="overflow-x-auto whitespace-nowrap pb-4 scrollbar-none">
            <div className="inline-flex gap-x-6 px-2 sm:px-6 lg:px-8">
              {collections.map((collection) => (
                <div
                  className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]"
                  key={collection.id}
                >
                  <CollectionCard collection={collection} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ContentSection />
        </div>

        {/* Products by Collection */}
        <div className="text-center my-10">
          <h1 className="text-5xl font-semibold uppercase text-gray-800">
            Dried Fruits
          </h1>
          <h2 className="text-lg italic font-normal text-gray-600 mt-1">
            Natural and Nutritious Snacks
          </h2>
        </div>

        {collections.map(
          (collection) =>
            collection.products &&
            collection.products.length > 0 && (
              <ProductCollectionSlider
                key={collection.id}
                collection={collection}
                activeOrderFetcher={activeOrderFetcher}
                activeOrder={activeOrder}
              />
            ),
        )}

        <div className="mt-6 px-4 sm:hidden">
          <a
            href="/collections"
            className="block text-sm font-semibold text-primary-600 hover:text-primary-500"
          >
            {t('common.browseCategories')}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </section>
    </>
  );
}
