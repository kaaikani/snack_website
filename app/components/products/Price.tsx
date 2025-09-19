import { CurrencyCode } from '~/generated/graphql';

export type PriceRange = {
  min: number;
  max: number;
};

export function Price({
  priceWithTax,
  currencyCode,
}: {
  priceWithTax?: number | PriceRange;
  currencyCode?: CurrencyCode;
}) {
  if (priceWithTax == null || !currencyCode) {
    return <></>;
  }
  if (typeof priceWithTax === 'number') {
    return <>{formatPrice(priceWithTax, currencyCode)}</>;
  }
  if (priceWithTax.min === priceWithTax.max) {
    return <>{formatPrice(priceWithTax.min, currencyCode)}</>;
  }
  return (
    <>
      {formatPrice(priceWithTax.min, currencyCode)} -{' '}
      {formatPrice(priceWithTax.max, currencyCode)}
    </>
  );
}

export function formatPrice(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value / 100);
}
