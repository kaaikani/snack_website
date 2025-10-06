'use client';
import {
  type MetaFunction,
  useLoaderData,
  useSubmit,
  useOutletContext,
} from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/server-runtime';
import { withZod } from '@remix-validated-form/with-zod';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValidatedForm } from 'remix-validated-form';
import { Breadcrumbs } from '~/components/Breadcrumbs';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { FiltersButton } from '~/components/FiltersButton';
import { FilterableProductGrid } from '~/components/products/FilterableProductGrid';
import { Header } from '~/components/header/Header';
import { APP_META_TITLE } from '~/constants';
import { filteredSearchLoaderFromPagination } from '~/utils/filtered-search-loader';
import { useActiveOrder } from '~/utils/use-active-order';
import { getCollections } from '~/providers/collections/collections';
import { getSessionStorage } from '~/sessions';
import { getActiveCustomer } from '~/providers/customer/customer';
import { sdk } from '../graphqlWrapper';
import Footer from '~/components/footer/Footer';
import { CartTray } from '~/components/cart/CartTray';
import type { ActiveCustomer } from '~/components/products/ProductCard';
import { ErrorCode, type ErrorResult } from '~/generated/graphql';
import Alert from '~/components/Alert';
import { getFrequentlyOrderedProducts } from '~/providers/customPlugins/customPlugin';

interface Collection {
  id: string;
  name: string;
  slug: string;
  breadcrumbs?: Array<{ id: string; name: string; slug: string }>;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    featuredAsset?: { id: string; preview: string } | null;
  }>;
  featuredAsset?: { id: string; preview: string } | null;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data?.collection
        ? `${data.collection?.name} - ${APP_META_TITLE}`
        : APP_META_TITLE,
    },
  ];
};

const paginationLimitMinimumDefault = 25;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  50,
  100,
]);

const { validator, filteredSearchLoader } = filteredSearchLoaderFromPagination(
  allowedPaginationLimits,
  paginationLimitMinimumDefault,
);

export async function loader({ params, request, context }: DataFunctionArgs) {
  const {
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    term,
  } = await filteredSearchLoader({
    params,
    request,
    context,
  });

  const frequentlyOrdered = await getFrequentlyOrderedProducts({ request });

  const collection = (await sdk.collection({ slug: params.slug }))
    .collection as Collection;

  if (!collection?.id || !collection?.name) {
    throw new Response('Not Found', {
      status: 404,
    });
  }

  const productDetails = await Promise.all(
    result.items.map(async (item: any) => {
      try {
        const { product } = await import('~/providers/products/products').then(
          (m) => m.getProductBySlug(item.slug, { request }),
        );
        return {
          ...item,
          variants: product?.variants || [],
        };
      } catch (e) {
        return { ...item, variants: [] };
      }
    }),
  );

  const collections = await getCollections(request, { take: 20 });
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );

  // ✅ Unified customer fetch
  const rawActiveCustomer = await getActiveCustomer({ request });

  const error = session.get('activeOrderError');

  const transformedActiveCustomer: ActiveCustomer = {
    activeCustomer: rawActiveCustomer?.activeCustomer
      ? {
          id: rawActiveCustomer.activeCustomer.id,
          favorites: {
            items: (rawActiveCustomer.activeCustomer.favorites?.items || [])
              .filter((fav) => fav.product?.id)
              .map((fav) => ({
                product: {
                  id: fav.product!.id,
                },
              })),
          },
        }
      : null,
  };

  const loyaltyPoints =
    rawActiveCustomer.activeCustomer?.customFields?.loyaltyPointsAvailable ??
    null;

  return {
    term,
    collection,
    result: { ...result, items: productDetails },
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    collections,
    activeCustomer: transformedActiveCustomer,
    loyaltyPoints,
    error,
    frequentlyOrdered,
  };
}

export default function CollectionSlug() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    collection,
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    collections,
    activeCustomer,
    loyaltyPoints,
    error,
  } = loaderData;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const { activeOrderFetcher } = useOutletContext<{
    activeOrderFetcher: any;
  }>();

  const { activeOrder } = activeOrderFetcher.data ?? {};
  const { adjustOrderLine, removeItem, refresh } = useActiveOrder();

  const handleAdjustQty = async (orderLineId: string, quantity: number) => {
    await adjustOrderLine(orderLineId, quantity);
    activeOrderFetcher.load('/api/active-order');
  };

  const handleRemoveItem = async (orderLineId: string) => {
    await removeItem(orderLineId);
    activeOrderFetcher.load('/api/active-order');
  };

  const addItemToOrderError = getAddItemToOrderError(error);

  useEffect(() => {
    setIsSignedIn(!!activeCustomer?.activeCustomer?.id);
  }, [activeCustomer?.activeCustomer?.id]);

  useEffect(() => {
    refresh();
  }, []);

  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );

  const submit = useSubmit();
  const { t } = useTranslation();

  return (
    <>
      <div className="max-w-7xl mx-auto mt-20 px-4 xl:w-full  py-4 xl:max-w-none xl:px-8">
        {/* Show global error if exists */}
        {addItemToOrderError && (
          <div className="mb-4">
            <Alert message={addItemToOrderError} />
          </div>
        )}

        <div className="flex flex-row justify-between items-center mb-4">
          <Breadcrumbs items={collection.breadcrumbs ?? []} />
          <FiltersButton
            filterCount={facetValueIds.length}
            onClick={() => setMobileFiltersOpen(true)}
          />
        </div>

        {collection.children?.length ? (
          <div className="w-full max-w-7xl mx-auto py-16 sm:py-16 border-b mb-16 px-2 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-light text-gray-900 text-center mb-8">
              {t('product.collections')}
            </h2>
            <div className="grid grid-cols-2 mob:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {collection.children
                .slice()
                .sort((a, b) => {
                  // Extract the last number from the slug
                  const getLastNumber = (slug: string) => {
                    const matches = slug.match(/(\d+)(?!.*\d)/);
                    return matches ? parseInt(matches[1], 10) : Infinity;
                  };
                  return getLastNumber(a.slug) - getLastNumber(b.slug);
                })
                .map((child: Collection) => (
                  <div key={child.id} className="aspect-square">
                    <CollectionCard collection={child} />
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {/* Separate the filter form from the product grid */}
        <div className="mt-6 grid gap-x-4">
          <ValidatedForm
            validator={withZod(validator)}
            method="get"
            onChange={(e: React.FormEvent<HTMLFormElement>) =>
              submit(e.currentTarget, { preventScrollReset: true })
            }
            className="contents"
          >
            <FilterableProductGrid
              allowedPaginationLimits={allowedPaginationLimits}
              mobileFiltersOpen={mobileFiltersOpen}
              setMobileFiltersOpen={setMobileFiltersOpen}
              result={result}
              resultWithoutFacetValueFilters={resultWithoutFacetValueFilters}
              facetValueIds={facetValueIds}
              appliedPaginationPage={appliedPaginationPage}
              appliedPaginationLimit={appliedPaginationLimit}
              activeCustomer={activeCustomer}
              activeOrderFetcher={activeOrderFetcher}
              activeOrder={activeOrder}
              isSignedIn={isSignedIn}
            />
          </ValidatedForm>
        </div>
      </div>
    </>
  );
}

export function CatchBoundary() {
  const { t } = useTranslation();
  return (
    <div className="max-w-6xl px-4 xl:w-full">
      <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-gray-900 my-8">
        {t('product.collectionNotFound')}
      </h2>
      <div className="mt-6 grid gap-x-4">
        <div className="space-y-6">
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
        </div>
        <div className="sm:col-span-5 lg:col-span-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6 xl:gap-x-8">
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
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
