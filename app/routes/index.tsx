import {
  useLoaderData,
  useOutletContext,
  useActionData,
} from '@remix-run/react';
import {
  json,
  type LoaderFunctionArgs,
  type DataFunctionArgs,
} from '@remix-run/node';
import { getCollections } from '~/providers/collections/collections';
import { getCustomBanners } from '~/providers/customPlugins/customPlugin';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import type { CurrencyCode } from '~/generated/graphql';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { ThreeLayoutBanner } from '~/components/ThreeLayoutBanner';
import { useTranslation } from 'react-i18next';
import ContentSection from '~/components/ContentSection';
import { ProductCollectionSlider } from '~/components/products/ProductCollectionSlider';
import { search } from '~/providers/products/products';
import useToggleState from '~/utils/use-toggle-state'; // Import useToggleState
import { updateCustomer } from '~/providers/account/account'; // Import updateCustomer
import { withZod } from '@remix-validated-form/with-zod'; // Import for validation
import { validationError } from 'remix-validated-form';
import { z } from 'zod';
import { FormIntent } from '~/routes/account';
import type { FormError } from '~/routes/account';
import { useState, useEffect } from 'react';
import { Hero } from '~/components/ui/hero';
import { SweetTreatsSection } from '~/components/SweetTreatsSection';
import { PhoneNumberModal } from '~/components/modal/PhoneNumberModal';

// Define phone number validator
const phoneNumberValidator = withZod(
  z.object({
    phoneNumber: z
      .string()
      .min(1, { message: 'Phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),
  }),
);

// Extend loader to fetch active customer details
export async function loader({ request }: LoaderFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });
  const { activeCustomer } = await getActiveCustomerDetails({ request }); // Fetch customer details

  let banners: any[] = [];
  try {
    const bannersResponse = await getCustomBanners(request);
    banners = bannersResponse ? bannersResponse.data : [];
  } catch (error) {
    console.error('Error fetching banners:', error);
  }

  // Fetch products for each collection (unchanged)
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

  // Sort collections by the number at the end of their slug
  const sortedCollections = collectionsWithProducts.sort((a, b) => {
    const extractNumber = (slug: string): number => {
      const match = slug.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : Infinity;
    };

    const numA = extractNumber(a.slug);
    const numB = extractNumber(b.slug);

    return numA - numB;
  });

  return json({
    collections: sortedCollections,
    banners,
    activeCustomer, // Include activeCustomer in loader data
  });
}

// Action to handle phone number updates
export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData();
  const intent = body.get('intent') as FormIntent | null;

  const formError = (formError: FormError, init?: number | ResponseInit) => {
    return json<FormError>(formError, init);
  };

  if (intent === FormIntent.UpdatePhone) {
    const result = await phoneNumberValidator.validate(body);

    if (result.error) {
      return validationError(result.error);
    }

    const { phoneNumber } = result.data;

    try {
      await updateCustomer({ phoneNumber }, { request });
      return json({ customerUpdated: true });
    } catch (error: any) {
      return formError(
        {
          message: error.message || 'Failed to update phone number',
          intent: FormIntent.UpdatePhone,
        },
        { status: 400 },
      );
    }
  }

  return formError({ message: 'No valid form intent' }, { status: 401 });
}

type OutletContext = {
  activeOrderFetcher: any;
  activeOrder: any;
  adjustOrderLine: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  isSignedIn: boolean;
};

export default function Index() {
  const { collections, banners, activeCustomer } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { activeOrderFetcher, activeOrder, isSignedIn } =
    useOutletContext<OutletContext>();
  const actionData = useActionData<typeof action>();
  const [showPhoneModal, openPhoneModal, closePhoneModal] = useToggleState(
    !activeCustomer?.phoneNumber && isSignedIn,
  ); // Show modal if no phone number and signed in
  const [formError, setFormError] = useState<FormError>();

  // Handle action data
  useEffect(() => {
    if (!actionData) return;

    if ('customerUpdated' in actionData) {
      closePhoneModal();
      setFormError(undefined);
    } else if ('message' in actionData) {
      setFormError(actionData);
    }
  }, [actionData, closePhoneModal]);

  const topRightBannerUrls = [
    'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/Common+Banner.jpg',
  ];

  const bottomRightBannerUrls = [
    'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/SOUTHMITHAI+-+DELFREE.jpg',
  ];

  const featuredCollections = [
    {
      slug: 'laddu-sweet-balls',
      backgroundColor: 'bg-white/60',
      backgroundColorInner: 'bg-white/60',
      bannerUrl:
        'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/Offer+1000.jpg',
    },
    {
      slug: 'thattai-sev-crispy-snacks',
      backgroundColor: 'bg-green-100',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
    {
      slug: 'podi-powder',
      backgroundColor: 'bg-orange-100',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
    {
      slug: 'achumurukku-murukku-fried-snacks ',
      backgroundColor: 'bg-orange-100',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
    {
      slug: 'adhirasam-special-sweets',
      backgroundColor: 'bg-orange-100',
      bannerUrl:
        'https://assets-jpcust.jwpsrv.com/thumbnails/0pz2lxly-1280.jpg',
    },
  ];

  return (
    <>
      {/* Add PhoneNumberModal */}
      {/* <PhoneNumberModal
        open={showPhoneModal}
        onOpenChange={closePhoneModal}
        formError={formError}
        isSubmitting={false} 
        fetcher={undefined}
      /> */}
      <Hero />

      <SweetTreatsSection collections={collections} />

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

        {/* <div className="text-center my-10 px-4 sm:px-6 lg:px-8 z-[-10]">
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
        </div> */}

        <div className="text-center my-10 px-4 sm:px-6 lg:px-8 z-[-10]">
          <h1 className="text-3xl sm:text-5xl font-semibold uppercase text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]">
            Taste of Tradition{' '}
          </h1>
          <h2 className="text-base sm:text-lg italic font-normal text-gray-900 mt-1">
            Explore our exquisite range of South Indian sweets and snacks.{' '}
          </h2>
        </div>

        {/* <div className="mt-4 z-[-10]">
          {featuredCollections.map((fc) => (
            <ProductCollectionSlider
              key={fc.slug}
              collectionSlug={fc.slug}
              activeOrderFetcher={activeOrderFetcher}
              activeOrder={activeOrder}
              isSignedIn={isSignedIn}
              backgroundColor={fc.backgroundColor}
              bannerUrl={fc.bannerUrl}
            />
          ))}
        </div> */}

        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3   gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="w-full h-full min-h-[180px] xs:min-h-[200px] sm:min-h-[240px] md:min-h-[280px] lg:min-h-[320px]"
              >
                <CollectionCard collection={collection} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 z-[-10]">
          <ContentSection />
        </div>
      </section>
    </>
  );
}
