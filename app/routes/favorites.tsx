'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  useLoaderData,
  useOutletContext,
  useFetcher,
  type MetaFunction,
} from '@remix-run/react';
import type { DataFunctionArgs, Session } from '@remix-run/server-runtime';
import { Header } from '~/components/header/Header';
import Footer from '~/components/footer/Footer';
import { CartTray } from '~/components/cart/CartTray';
import { ProductCard, ActiveCustomer } from '~/components/products/ProductCard';
import { getCollections } from '~/providers/collections/collections';
import { getActiveCustomer } from '~/providers/customer/customer';
import { getProductById } from '~/providers/products/products';
import { APP_META_TITLE } from '~/constants';
import { useActiveOrder } from '~/utils/use-active-order';
import Alert from '~/components/Alert';
import {
  ErrorCode,
  OrderDetailFragment,
  type ErrorResult,
} from '~/generated/graphql';
import { getSessionStorage } from '~/sessions';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    {
      title: `Favorites - ${APP_META_TITLE}`,
    },
  ];
};

export async function loader({ request }: DataFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });
  const rawActiveCustomer = await getActiveCustomer({ request });

  const favoriteProducts = rawActiveCustomer?.activeCustomer?.favorites?.items
    ?.length
    ? await Promise.all(
        rawActiveCustomer.activeCustomer.favorites.items
          .filter((fav) => fav.product?.id)
          .map(async (fav) => {
            try {
              const { product } = await getProductById(fav.product!.id, {
                request,
              });
              if (!product) {
                console.warn(`Product with ID ${fav.product!.id} not found`);
                return null;
              }
              return {
                product: {
                  id: product.id,
                  name: product.name,
                  slug: product.slug || '',
                  productAsset: product.featuredAsset || null,
                  priceWithTax: product.variants?.[0]?.priceWithTax || 0,
                  currencyCode: product.variants?.[0]?.currencyCode || 'INR',
                  variants: product.variants || [],
                },
              };
            } catch (e) {
              console.error(`Failed to fetch product ${fav.product!.id}:`, e);
              return null;
            }
          }),
      )
    : [];

  const transformedActiveCustomer: ActiveCustomer = {
    activeCustomer: rawActiveCustomer?.activeCustomer
      ? {
          id: rawActiveCustomer.activeCustomer.id,
          favorites: {
            items: favoriteProducts.filter((item) => item !== null),
          },
        }
      : null,
  };

  const loyaltyPoints =
    rawActiveCustomer.activeCustomer?.customFields?.loyaltyPointsAvailable ??
    null;

  const sessionStorage = await getSessionStorage();
  const session: Session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );
  const error = session.get('activeOrderError');

  return {
    collections,
    activeCustomer: transformedActiveCustomer,
    loyaltyPoints,
    error,
  };
}

export default function Favorites() {
  const { t } = useTranslation();
  const { collections, activeCustomer, loyaltyPoints, error } =
    useLoaderData<typeof loader>();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState(
    activeCustomer?.activeCustomer?.favorites?.items || [],
  );

  useEffect(() => {
    setIsSignedIn(!!activeCustomer?.activeCustomer?.id);
  }, [activeCustomer]);

  const fetcher = useFetcher();

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

  const handleFavoriteToggle = (productId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      setFavoriteItems((prev) =>
        prev.filter((item: any) => item.product.id !== productId),
      );
    }
    fetcher.load('/favorites');
  };

  const addItemToOrderError = error ? getAddItemToOrderError(error) : undefined;

  return (
    <>
      <div className="max-w-6xl min-h-screen px-4 mt-20 xl:w-full xl:max-w-none xl:px-8">
        {addItemToOrderError && (
          <div className="mb-4">
            <Alert message={addItemToOrderError} />
          </div>
        )}

        <div className="py-5">
          <h2 className="text-3xl font-bolder text-gray-900 text-center mb-8">
            Favorites
          </h2>
          {isSignedIn && favoriteItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-y-10 gap-x-6 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
              {favoriteItems.map((item: any) => (
                <ProductCard
                  key={item.product.id}
                  productId={item.product.id}
                  productName={item.product.name}
                  slug={item.product.slug}
                  productAsset={item.product.productAsset}
                  priceWithTax={item.product.priceWithTax}
                  currencyCode={item.product.currencyCode}
                  variants={item.product.variants}
                  activeCustomer={activeCustomer}
                  activeOrderFetcher={activeOrderFetcher}
                  activeOrder={activeOrder}
                  onFavoriteToggle={handleFavoriteToggle}
                  isSignedIn={isSignedIn}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              {isSignedIn ? 'No Favorites' : 'Sign In To View Favorites'}
              {!isSignedIn && (
                <div className="mt-4">
                  <Link to="/" className="text-blue-600 hover:text-blue-800">
                    SignIn
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
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
    default:
      return undefined;
  }
}
