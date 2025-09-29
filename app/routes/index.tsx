import { useLoaderData, useOutletContext } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getCollections } from '~/providers/collections/collections';
import { getCustomBanners } from '~/providers/customPlugins/customPlugin';
import type { CurrencyCode } from '~/generated/graphql';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { ThreeLayoutBanner } from '~/components/ThreeLayoutBanner';
import { useTranslation } from 'react-i18next';
import ContentSection from '~/components/ContentSection';
import { ProductCollectionSlider } from '~/components/products/ProductCollectionSlider';
import { search } from '~/providers/products/products';
import Footer from '~/components/footer/Footer';

export async function loader({ request }: LoaderFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });

  let banners: any[] = [];
  try {
    // Always use your fixed channel token
    const bannersResponse = await getCustomBanners(request);
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
    banners: banners,
  });
}

type OutletContext = {
  activeOrderFetcher: any;
  activeOrder: any;
  adjustOrderLine: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  isSignedIn: boolean;
};

export default function Index() {
  const { collections, banners } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { activeOrderFetcher, activeOrder, isSignedIn } =
    useOutletContext<OutletContext>();

  const topRightBannerUrls = [
    'https://t4.ftcdn.net/jpg/01/73/41/63/360_F_173416361_2YCaYyXrVk6nhNoIkg21515HUWseyqyr.jpg',
    'https://media.istockphoto.com/id/478815753/photo/salty-snacks.jpg?s=612x612&w=0&k=20&c=7dMQ0YP3sbbjNl2W94GWuiydofEFDmVax7svrAsvRbg=',
    'https://thumbs.dreamstime.com/b/snack-food-appetizer-banner-design-vector-template-tasty-meal-lunch-item-353310718.jpg ',
  ];

  const bottomRightBannerUrls = [
    'https://previews.123rf.com/images/mizina/mizina1906/mizina190600049/124929006-assortment-of-unhealthy-snacks-chips-popcorn-nachos-pretzels-onion-rings-in-bowls-top-view.jpg',
    'https://www.shutterstock.com/image-photo/granola-bars-assortment-isolated-on-260nw-1398605279.jpg',
    'https://thumbs.dreamstime.com/b/variation-salty-snacks-overhead-view-table-scene-dark-wood-banner-background-192481193.jpg',
  ];

  const featuredCollections = [
    {
      slug: 'flowers-11',
      backgroundColor: 'bg-white/60',
      backgroundColorInner: 'bg-white/60',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
    {
      slug: 'vegetables-1',
      backgroundColor: 'bg-green-100',
      backgroundColorInner: 'bg-red-100',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
    {
      slug: 'ready-to-eat-10',
      backgroundColor: 'bg-orange-100',
      backgroundColorInner: 'bg-red-100',
    },
  ];

  return (
    <>
      <section aria-labelledby="category-heading" className="z-[-10]">
        {banners &&
          banners.length >= 1 &&
          topRightBannerUrls.length >= 1 &&
          bottomRightBannerUrls.length >= 1 && (
            <section className="mt-3 mb-8 xl:mb-5 px-2 sm:px-3 lg:px-4 relative z-[-10]">
              <ThreeLayoutBanner
                banners={banners}
                topRightBannerUrls={topRightBannerUrls}
                bottomRightBannerUrls={bottomRightBannerUrls}
              />
            </section>
          )}

        <div className="text-center my-10 px-4 sm:px-6 lg:px-8 z-[-10]">
          <h1 className="text-4xl sm:text-5xl font-semibold uppercase text-gray-800">
            Sweet Treats
          </h1>
          <h2 className="text-base sm:text-lg italic font-normal text-gray-600 mt-1">
            Indulgent Desserts and Candies
          </h2>
        </div>

        <div className="mt-4 z-[-10]">
          <div className="overflow-x-auto whitespace-nowrap pb-4 scrollbar-none snap-x snap-mandatory">
            <div className="inline-flex gap-x-4 sm:gap-x-6 px-4 sm:px-6 lg:px-8">
              {collections.map((collection) => (
                <div
                  className="flex-shrink-0 w-32 sm:w-[180px] md:w-[200px] snap-center"
                  key={collection.id}
                >
                  <CollectionCard collection={collection} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 z-[-10]">
          <ContentSection />
        </div>

        <div className="text-center my-10 px-4 sm:px-6 lg:px-8 z-[-10]">
          <h1 className="text-4xl sm:text-5xl font-semibold uppercase text-gray-800">
            Dried Fruits
          </h1>
          <h2 className="text-base sm:text-lg italic font-normal text-gray-600 mt-1">
            Natural and Nutritious Snacks
          </h2>
        </div>

        <div className="mt-4 z-[-10]">
          {featuredCollections.map((fc) => (
            <ProductCollectionSlider
              key={fc.slug}
              collectionSlug={fc.slug}
              activeOrderFetcher={activeOrderFetcher}
              activeOrder={activeOrder}
              isSignedIn={isSignedIn}
              backgroundColor={fc.backgroundColor}
              backgroundColorInner={fc.backgroundColorInner}
              bannerUrl={fc.bannerUrl}
            />
          ))}
        </div>
      </section>
    </>
  );
}
