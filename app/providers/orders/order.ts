import gql from 'graphql-tag';
import { QueryOptions, sdk } from '../../graphqlWrapper';
import {
  CreateAddressInput,
  CreateCustomerInput,
  PaymentInput,
} from '~/generated/graphql';
import type {
  AddPaymentToOrderResponse,
  PaymentOrderResponse,
  PaymentError,
} from '~/types/payment';

export function getActiveOrder(options: QueryOptions) {
  return sdk
    .activeOrder(undefined, options)
    .then(({ activeOrder }) => activeOrder);
}

export function getOrderByCode(code: string, options: QueryOptions) {
  return sdk
    .orderByCode({ code }, options)
    .then(({ orderByCode }) => orderByCode);
}

export function addItemToOrder(
  productVariantId: string,
  quantity: number,
  options: QueryOptions,
) {
  return sdk.addItemToOrder(
    {
      productVariantId,
      quantity,
    },
    options,
  );
}

export function removeOrderLine(lineId: string, options: QueryOptions) {
  return sdk.removeOrderLine({ orderLineId: lineId }, options);
}

export function adjustOrderLine(
  lineId: string,
  quantity: number,
  options: QueryOptions,
) {
  return sdk.adjustOrderLine({ orderLineId: lineId, quantity }, options);
}

export function setCustomerForOrder(
  input: CreateCustomerInput,
  options: QueryOptions,
) {
  return sdk.setCustomerForOrder({ input }, options);
}

export function setOrderShippingAddress(
  input: CreateAddressInput,
  options: QueryOptions,
) {
  return sdk.setOrderShippingAddress({ input }, options);
}

export function setOrderShippingMethod(
  shippingMethodId: string,
  options: QueryOptions,
) {
  return sdk.setOrderShippingMethod({ shippingMethodId }, options);
}

/**
 * Adds a payment to the active order
 * @param input - Payment input containing method and metadata
 * @param options - Query options including request and custom headers
 * @returns Promise resolving to a typed payment response (success or error)
 */
export async function addPaymentToOrder(
  input: PaymentInput,
  options: QueryOptions,
): Promise<AddPaymentToOrderResponse> {
  const response = await sdk.addPaymentToOrder({ input }, options);
  const result = response.addPaymentToOrder as any;

  // Check if the result is a successful Order
  if (result?.__typename === 'Order') {
    const order: PaymentOrderResponse = {
      id: result.id || '',
      code: result.code || '',
      state: result.state || '',
      totalWithTax: result.totalWithTax || 0,
      payments: (result.payments || []).map((payment: any) => ({
        id: payment.id || '',
        amount: payment.amount || 0,
        state: payment.state || '',
        transactionId: payment.transactionId || null,
      })),
    };

    return {
      success: true,
      order,
    };
  }

  // Check if the result is an error
  if (
    result?.__typename === 'IneligiblePaymentMethodError' ||
    result?.__typename === 'NoActiveOrderError' ||
    result?.__typename === 'OrderPaymentStateError' ||
    result?.__typename === 'OrderStateTransitionError' ||
    result?.__typename === 'PaymentDeclinedError' ||
    result?.__typename === 'PaymentFailedError'
  ) {
    return {
      success: false,
      error: result as PaymentError,
    };
  }

  // Fallback for unexpected response type
  return {
    success: false,
    error: {
      __typename: 'PaymentFailedError',
      errorCode: 'PAYMENT_FAILED_ERROR' as any,
      message: 'Unexpected response from payment service',
      paymentErrorMessage: 'Unknown error occurred',
    },
  };
}

export function applyCouponCode(input: string, options: QueryOptions) {
  return sdk
    .ApplyCouponCode({ input }, options)
    .then((response) => response.applyCouponCode);
}

export function removeCouponCode(couponCode: string, options: QueryOptions) {
  return sdk
    .RemoveCouponCode({ couponCode }, options)
    .then((response) => response.removeCouponCode);
}

export function getCouponCodeList(options: QueryOptions) {
  return sdk.GetCouponCodeList(undefined, options).then((response) =>
    response.getCouponCodeList.items.map((c) => ({
      id: c.id,
      name: c.name,
      couponCode: c.couponCode,
      description: c.description,
      enabled: c.enabled,
      endsAt: c.endsAt,
      startsAt: c.startsAt,
      usageLimit: c.usageLimit,
      updatedAt: c.updatedAt,
      conditions: c.conditions.map((condition) => ({
        code: condition.code,
        args: condition.args.map((arg) => ({
          name: arg.name,
          value: arg.value,
        })),
      })),
      actions: c.actions.map((action) => ({
        code: action.code,
        args: action.args.map((arg) => ({
          name: arg.name,
          value: arg.value,
        })),
      })),
    })),
  );
}

export async function addCouponProductToCart(
  couponCode: string,
  options: QueryOptions,
) {
  try {
    console.log(`Fetching coupon code: ${couponCode}`);
    const couponList = await getCouponCodeList(options);
    const coupon = couponList.find((c) => c.couponCode === couponCode);

    if (!coupon) {
      console.error(`Coupon code ${couponCode} not found in list`, couponList);
      throw new Error(`Coupon code ${couponCode} not found`);
    }

    console.log('Coupon found:', coupon);
    const productVariantIds: string[] = [];
    for (const condition of coupon.conditions) {
      const variantArg = condition.args.find(
        (arg) => arg.name === 'productVariantIds',
      );
      if (variantArg && variantArg.value) {
        console.log('Found productVariantIds arg:', variantArg.value);
        try {
          let parsedIds: string[] | string = variantArg.value;
          if (variantArg.value.startsWith('[')) {
            parsedIds = JSON.parse(variantArg.value);
          } else {
            parsedIds = [variantArg.value];
          }
          if (Array.isArray(parsedIds)) {
            productVariantIds.push(...parsedIds.map((id) => id.toString()));
          } else if (typeof parsedIds === 'string') {
            productVariantIds.push(parsedIds);
          }
        } catch (e) {
          console.error(
            'Failed to parse productVariantIds:',
            variantArg.value,
            e,
          );
          throw new Error(
            `Invalid productVariantIds format for coupon ${couponCode}`,
          );
        }
      }
    }

    if (productVariantIds.length === 0) {
      console.error(`No product variant IDs found for coupon ${couponCode}`);
      throw new Error(
        `No product variant ID found for coupon code ${couponCode}`,
      );
    }

    console.log(`Product variant IDs to add: ${productVariantIds.join(', ')}`);

    // Check initial cart state
    const initialOrder = await getActiveOrder(options);
    const initialQuantities = new Map<string, number>();
    productVariantIds.forEach((id) => {
      const quantity =
        initialOrder?.lines?.find((line) => line.productVariant.id === id)
          ?.quantity || 0;
      initialQuantities.set(id, quantity);
      console.log(`Initial quantity of product variant ${id}: ${quantity}`);
    });

    // Add each product variant to the cart
    for (const productVariantId of productVariantIds) {
      console.log(
        `Adding product variant ID: ${productVariantId} to cart with quantity 1`,
      );
      const addResult = await addItemToOrder(productVariantId, 1, options);
      console.log(`addItemToOrder result for ${productVariantId}:`, addResult);
    }

    // Verify the cart update
    const updatedOrder = await getActiveOrder(options);
    const updatedQuantities = new Map<string, number>();
    productVariantIds.forEach((id) => {
      const quantity =
        updatedOrder?.lines?.find((line) => line.productVariant.id === id)
          ?.quantity || 0;
      updatedQuantities.set(id, quantity);
      console.log(`Updated quantity of product variant ${id}: ${quantity}`);
    });

    // Validate that quantities increased
    for (const id of productVariantIds) {
      const initial = initialQuantities.get(id) || 0;
      const updated = updatedQuantities.get(id) || 0;
      if (updated < initial + 1) {
        console.error(`Failed to increase quantity for product variant ${id}`);
        throw new Error(
          `Failed to add product ${id} to cart: quantity did not increase`,
        );
      }
    }

    return { addedProductVariantIds: productVariantIds };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in addCouponProductToCart: ${errorMessage}`);
    throw new Error(`Failed to add products to cart: ${errorMessage}`);
  }
}

export async function removeCouponProductFromCart(
  couponCode: string,
  options: QueryOptions,
) {
  try {
    console.log(`Fetching coupon code for removal: ${couponCode}`);
    const couponList = await getCouponCodeList(options);
    const coupon = couponList.find((c) => c.couponCode === couponCode);

    if (!coupon) {
      console.error(`Coupon code ${couponCode} not found in list`, couponList);
      throw new Error(`Coupon code ${couponCode} not found`);
    }

    console.log('Coupon found:', coupon);
    const productVariantIds: string[] = [];
    for (const condition of coupon.conditions) {
      const variantArg = condition.args.find(
        (arg) => arg.name === 'productVariantIds',
      );
      if (variantArg && variantArg.value) {
        console.log('Found productVariantIds arg:', variantArg.value);
        try {
          let parsedIds: string[] | string = variantArg.value;
          if (variantArg.value.startsWith('[')) {
            parsedIds = JSON.parse(variantArg.value);
          } else {
            parsedIds = [variantArg.value];
          }
          if (Array.isArray(parsedIds)) {
            productVariantIds.push(...parsedIds.map((id) => id.toString()));
          } else if (typeof parsedIds === 'string') {
            productVariantIds.push(parsedIds);
          }
        } catch (e) {
          console.error(
            'Failed to parse productVariantIds:',
            variantArg.value,
            e,
          );
          throw new Error(
            `Invalid productVariantIds format for coupon ${couponCode}`,
          );
        }
      }
    }

    if (productVariantIds.length === 0) {
      console.log(
        `No product variant IDs found for coupon ${couponCode}, skipping removal`,
      );
      return null;
    }

    console.log(
      `Product variant IDs to adjust/remove: ${productVariantIds.join(', ')}`,
    );
    const activeOrder = await getActiveOrder(options);
    if (!activeOrder?.lines) {
      console.log('No lines found in active order, skipping removal');
      return activeOrder;
    }

    // Adjust or remove each product variant
    for (const productVariantId of productVariantIds) {
      const lineToAdjust = activeOrder.lines.find(
        (line) => line.productVariant.id === productVariantId,
      );

      if (!lineToAdjust) {
        console.log(
          `No order line found for product variant ID: ${productVariantId}, skipping`,
        );
        continue;
      }

      if (lineToAdjust.quantity > 1) {
        console.log(
          `Adjusting quantity for order line ID: ${lineToAdjust.id} from ${
            lineToAdjust.quantity
          } to ${lineToAdjust.quantity - 1}`,
        );
        const adjustResult = await adjustOrderLine(
          lineToAdjust.id,
          lineToAdjust.quantity - 1,
          options,
        );
        console.log(
          `adjustOrderLine result for ${productVariantId}:`,
          adjustResult,
        );
      } else {
        console.log(
          `Removing order line ID: ${lineToAdjust.id} as quantity is 1`,
        );
        const removeResult = await removeOrderLine(lineToAdjust.id, options);
        console.log(
          `removeOrderLine result for ${productVariantId}:`,
          removeResult,
        );
      }
    }

    const updatedOrder = await getActiveOrder(options);
    console.log('Updated order after adjusting/removing items:', updatedOrder);

    return updatedOrder;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in removeCouponProductFromCart: ${errorMessage}`);
    throw new Error(
      `Failed to adjust product quantities in cart: ${errorMessage}`,
    );
  }
}

gql`
  mutation setCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation setOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation setOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation addPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      __typename
      ... on Order {
        id
        code
        state
        totalWithTax
        payments {
          id
          amount
          state
          transactionId
        }
      }
      ... on OrderPaymentStateError {
        errorCode
        message
      }
      ... on IneligiblePaymentMethodError {
        errorCode
        message
      }
      ... on PaymentFailedError {
        errorCode
        message
      }
      ... on PaymentDeclinedError {
        errorCode
        message
      }
      ... on OrderStateTransitionError {
        errorCode
        message
      }
      ... on NoActiveOrderError {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation addItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation removeOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation adjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ...OrderDetail
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  fragment OrderDetail on Order {
    __typename
    id
    code
    active
    createdAt
    state
    currencyCode
    totalQuantity
    subTotal
    subTotalWithTax
    validationStatus {
      isValid
      hasUnavailableItems
      totalUnavailableItems
      unavailableItems {
        orderLineId
        productName
        variantName
        reason
      }
    }
    surcharges {
      id
      price
    }
    taxSummary {
      description
      taxRate
      taxTotal
    }
    shippingWithTax
    totalWithTax
    couponCodes
    promotions {
      id
      couponCode
      name
      enabled
      actions {
        args {
          value
          name
        }
        code
      }
      conditions {
        code
        args {
          name
          value
        }
      }
    }
    customer {
      id
      firstName
      lastName
      emailAddress
    }
    shippingAddress {
      fullName
      streetLine1
      streetLine2
      company
      city
      province
      postalCode
      countryCode
      phoneNumber
    }
    shippingLines {
      shippingMethod {
        id
        name
      }
      priceWithTax
    }
    lines {
      id
      unitPriceWithTax
      linePriceWithTax
      quantity
      featuredAsset {
        id
        preview
      }
      productVariant {
        id
        name
        price
        stockLevel
        product {
          id
          slug
        }
      }
    }
    payments {
      id
      state
      method
      amount
      metadata
    }
  }
`;

gql`
  query activeOrder {
    activeOrder {
      ...OrderDetail
      couponCodes
      customFields {
        otherInstructions
      }
    }
  }
`;

gql`
  query orderByCode($code: String!) {
    orderByCode(code: $code) {
      ...OrderDetail
    }
  }
`;

gql`
  query GetCouponCodeList {
    getCouponCodeList {
      items {
        id
        name
        couponCode
        description
        enabled
        endsAt
        startsAt
        updatedAt
        conditions {
          code
          args {
            name
            value
          }
        }
        actions {
          code
          args {
            name
            value
          }
        }
        usageLimit
      }
      totalItems
      __typename
    }
  }
`;

gql`
  mutation ApplyCouponCode($input: String!) {
    applyCouponCode(couponCode: $input) {
      __typename
      ... on Order {
        id
        couponCodes
        total
      }
      ... on CouponCodeInvalidError {
        message
      }
    }
  }
`;

gql`
  mutation RemoveCouponCode($couponCode: String!) {
    removeCouponCode(couponCode: $couponCode) {
      __typename
    }
  }
`;
