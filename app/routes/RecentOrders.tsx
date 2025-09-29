'use client';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '~/components/products/ProductCard';

export function RecentOrders({
  products,
  activeCustomer,
  activeOrderFetcher,
  activeOrder,
}: {
  products: Array<any>;
  activeCustomer: any;
  activeOrderFetcher: any;
  activeOrder: any;
}) {
  const { t } = useTranslation();

  if (!products?.length) return null;

  // sort by orderCount (descending) and pick top 10
  const topProducts = [...products]
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 xl:px-8 py-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Recent Orders
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {topProducts.map((item: any) => (
          <div
            key={item.product.id}
            className="min-w-[220px] max-w-[240px] flex-shrink-0"
          >
            {/* <div className="text-xs text-gray-500 mt-1">
              {item.orderCount} Times Ordered
            </div> */}
            <ProductCard
              productAsset={item.product.featuredAsset}
              productName={item.product.name}
              slug={item.product.slug}
              priceWithTax={item.product.variants?.[0]?.priceWithTax}
              currencyCode={item.product.variants?.[0]?.currencyCode}
              variants={item.product.variants}
              productId={item.product.id}
              activeCustomer={activeCustomer}
              activeOrderFetcher={activeOrderFetcher}
              activeOrder={activeOrder}
              orderCount={item.orderCount}
              isSignedIn={!!activeCustomer?.activeCustomer?.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
