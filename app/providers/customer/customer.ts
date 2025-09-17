import gql from 'graphql-tag';
import { QueryOptions, sdk } from '~/graphqlWrapper';
import { OrderListOptions } from '~/generated/graphql';

// Extend QueryOptions to include variables for pagination
interface ExtendedQueryOptions extends QueryOptions {
  variables?: {
    options?: {
      take?: number;
      skip?: number;
    };
  };
}

export function getActiveCustomer(options: ExtendedQueryOptions) {
  return sdk.activeCustomer(undefined, options);
}

export function getActiveCustomerDetails(options: QueryOptions) {
  return sdk.activeCustomerDetails(undefined, options);
}

export function getActiveCustomerAddresses(options: QueryOptions) {
  return sdk.activeCustomerAddresses(undefined, options);
}

export function getActiveCustomerOrderList(
  orderListOptions: OrderListOptions,
  options: QueryOptions,
) {
  return sdk.activeCustomerOrderList({ orderListOptions }, options);
}

gql`
  query activeCustomer($options: LoyaltyPointsTransactionListOptions) {
    activeCustomer {
      id
      firstName
      lastName
      favorites {
        totalItems
        items {
          id
          product {
            id
            name
          }
        }
      }
      # ✅ Loyalty points merged
      customFields {
        loyaltyPointsAvailable
      }
      loyaltyPointsTransactions(options: $options) {
        items {
          id
          createdAt
          updatedAt
          note
          value
          order {
            id
            code
            orderPlacedAt
            state
          }
          __typename
        }
        totalItems
      }
    }
  }
`;

gql`
  query activeCustomerDetails {
    activeCustomer {
      id
      title
      firstName
      lastName
      phoneNumber
      emailAddress
    }
  }
`;

gql`
  query activeCustomerAddresses {
    activeCustomer {
      id
      addresses {
        id
        company
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          id
          code
          name
        }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
      }
    }
  }
`;

gql`
  query activeCustomerOrderList($orderListOptions: OrderListOptions) {
    activeCustomer {
      id
      firstName
      emailAddress
      # ✅ Favorites kept in order list too
      favorites {
        totalItems
        items {
          id
          product {
            id
            name
          }
        }
      }
      orders(options: $orderListOptions) {
        totalItems
        items {
          id
          code
          state
          orderPlacedAt
          currencyCode
          subTotal
          subTotalWithTax
          total
          totalWithTax
          shippingWithTax
          shippingLines {
            priceWithTax
          }
          taxSummary {
            taxBase
            taxTotal
          }
          discounts {
            amountWithTax
          }
          fulfillments {
            trackingCode
          }
          customFields {
            clientRequestToCancel
            otherInstructions
          }
          lines {
            quantity
            discountedLinePriceWithTax
            discountedUnitPriceWithTax
            fulfillmentLines {
              quantity
              fulfillment {
                state
                updatedAt
              }
            }
            featuredAsset {
              name
              source
              preview
            }
            productVariant {
              name
              sku
              currencyCode
              priceWithTax
              product {
                slug
              }
            }
          }
        }
      }
    }
  }
`;
