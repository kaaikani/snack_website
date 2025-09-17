'use client';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useRef, useState } from 'react';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { filteredSearchLoaderFromPagination } from '~/utils/filtered-search-loader';
import { FiltersButton } from '~/components/FiltersButton';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { paginationValidationSchema } from '~/utils/pagination';
import { FilterableProductGrid } from '~/components/products/FilterableProductGrid';
import { useTranslation } from 'react-i18next';
import { Header } from '~/components/header/Header';
import Footer from '~/components/footer/Footer';
import { getCollections } from '~/providers/collections/collections';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useActiveOrder } from '~/utils/use-active-order';
import { CartTray } from '~/components/cart/CartTray';
import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/node';
import type { CurrencyCode } from '~/generated/graphql';

// Define the expected loader data structure
interface LoaderData {
  result: {
    __typename?: 'SearchResponse';
    items: Array<{
      __typename?: 'SearchResult';
      productId: string;
      productName: string;
      slug: string;
      priceWithTax:
        | { __typename?: 'SinglePrice'; value: number }
        | { __typename?: 'PriceRange'; min: number; max: number };
      currencyCode: CurrencyCode;
      productAsset?: {
        __typename?: 'SearchResultAsset';
        id: string;
        preview: string;
      } | null;
      variants: Array<{
        __typename?: 'ProductVariant';
        id: string;
        name: string;
        priceWithTax: number;
        currencyCode: CurrencyCode;
        sku: string;
        stockLevel: string;
        featuredAsset?: { __typename?: 'Asset'; id: string; preview: string };
      }>;
    }>;
    totalItems: number;
    facetValues: Array<{
      __typename?: 'FacetValueResult';
      count: number;
      facetValue: {
        __typename?: 'FacetValue';
        id: string;
        name: string;
        facet: { __typename?: 'Facet'; id: string; name: string };
      };
    }>;
  };
  resultWithoutFacetValueFilters: any; // Keep as any since it’s not used strictly
  term: string;
  facetValueIds: string[];
  appliedPaginationLimit: number;
  appliedPaginationPage: number;
  collections: Array<{
    __typename?: 'Collection';
    id: string;
    name: string;
    slug: string;
    parent?: { __typename?: 'Collection'; name: string } | null;
    featuredAsset?: {
      __typename?: 'Asset';
      id: string;
      preview: string;
    } | null;
  }>;
  activeCustomer: {
    activeCustomer?: {
      id: string;
      favorites?: {
        items: Array<{ product: { id: string } }>;
      };
    } | null;
  };
  loyaltyPoints: number | null;
}

const paginationLimitMinimumDefault = 25;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  50,
  100,
]);
const validator = withZod(paginationValidationSchema(allowedPaginationLimits));

export async function loader(args: LoaderFunctionArgs) {
  const collections = await getCollections(args.request, { take: 20 });
  const activeCustomerRaw = await getActiveCustomer({ request: args.request });
  const { filteredSearchLoader } = filteredSearchLoaderFromPagination(
    allowedPaginationLimits,
    paginationLimitMinimumDefault,
  );
  const searchData = await filteredSearchLoader(args);

  // Fetch variant data for each product
  const productDetails = await Promise.all(
    searchData.result.items.map(async (item: any) => {
      try {
        const { product } = await import('~/providers/products/products').then(
          (m) => m.getProductBySlug(item.slug, { request: args.request }),
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

  const activeCustomer = activeCustomerRaw.activeCustomer
    ? {
        activeCustomer: {
          id: activeCustomerRaw.activeCustomer.id,
          favorites: activeCustomerRaw.activeCustomer.favorites
            ? {
                items: activeCustomerRaw.activeCustomer.favorites.items
                  .filter((item) => item.product != null)
                  .map((item) => ({
                    product: { id: item.product!.id },
                  })),
              }
            : undefined,
        },
      }
    : { activeCustomer: null };

  const loyaltyPoints =
    activeCustomerRaw.activeCustomer?.customFields?.loyaltyPointsAvailable ??
    null;

  return json({
    ...searchData,
    result: { ...searchData.result, items: productDetails },
    collections,
    activeCustomer,
    loyaltyPoints,
  });
}

export default function Search() {
  const loaderData = useLoaderData<LoaderData>();
  const {
    result,
    resultWithoutFacetValueFilters,
    term,
    facetValueIds,
    collections = [],
    activeCustomer,
    loyaltyPoints,
  } = loaderData;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );
  const submit = useSubmit();
  const { t } = useTranslation();
  const {
    activeOrderFetcher,
    activeOrder,
    adjustOrderLine,
    removeItem,
    refresh,
  } = useActiveOrder();
  const isSignedIn = !!activeCustomer?.activeCustomer?.id;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 my-8">
            {term ? `Results for "${term}"` : 'All Results'}
          </h2>

          <FiltersButton
            filterCount={facetValueIds.length}
            onClick={() => setMobileFiltersOpen(true)}
          />
        </div>

        <ValidatedForm
          validator={validator}
          method="get"
          onChange={(e) =>
            submit(e.currentTarget, { preventScrollReset: true })
          }
        >
          <FilterableProductGrid
            allowedPaginationLimits={allowedPaginationLimits}
            mobileFiltersOpen={mobileFiltersOpen}
            setMobileFiltersOpen={setMobileFiltersOpen}
            activeOrderFetcher={activeOrderFetcher}
            result={result}
            resultWithoutFacetValueFilters={resultWithoutFacetValueFilters}
            facetValueIds={facetValueIds}
            appliedPaginationLimit={loaderData.appliedPaginationLimit}
            appliedPaginationPage={loaderData.appliedPaginationPage}
            activeCustomer={activeCustomer}
            activeOrder={activeOrder}
          />
        </ValidatedForm>
      </div>
      <Footer />
    </>
  );
}
