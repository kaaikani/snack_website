import gql from 'graphql-tag';
import {
  CheckUniquePhoneQuery,
  CustomBanner,
  CustomBannersQuery,
  GetChannelListQuery,
  GetChannelsByCustomerEmailQuery,
  GetChannelsByCustomerEmailQueryVariables,
  GetChannelsByCustomerPhonenumberQuery,
  GetPasswordResetTokenQuery,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
  ResetPasswordMutation,
  SendPhoneOtpMutation,
  SendPhoneOtpMutationVariables,
  CancelOrderOnClientRequestMutation,
  OtherInstructionsMutation,
  ToggleFavoriteMutation,
  RemoveLoyaltyPointsFromActiveOrderMutation,
  ApplyLoyaltyPointsMutation,
  LoyaltyPointsConfig,
  UpdateOrderPlacedAtIstMutation,
  GetFrequentlyOrderedProductsQuery,
  AuthenticateGoogleMutation,
  GetCollectionProductsBySlugQuery,
  GetCollectionProductsBySlugDocument,
  ProductVariantList,
} from '~/generated/graphql';

type CollectionWithProductVariants =
  GetCollectionProductsBySlugQuery['collection'];

import { QueryOptions, sdk, WithHeaders } from '~/graphqlWrapper';

export async function getChannelList(p0: {
  request: Request;
}): Promise<WithHeaders<GetChannelListQuery['getChannelList']>> {
  return sdk.getChannelList().then((res) => {
    const data = res.getChannelList;
    const result = Object.assign([...data], { _headers: res._headers });
    return result;
  });
}

gql`
  query getChannelList {
    getChannelList {
      id
      token
      code
    }
  }
`;

export async function getChannelsByCustomerEmail(
  email: string,
): Promise<
  WithHeaders<GetChannelsByCustomerEmailQuery['getChannelsByCustomerEmail']>
> {
  const response = await sdk.GetChannelsByCustomerEmail({ email });
  const result = Object.assign([...response.getChannelsByCustomerEmail], {
    _headers: response._headers,
  });
  return result;
}

export async function getPasswordResetToken(
  email: string,
  p0: { request: Request; customHeaders: { 'vendure-token': string } },
): Promise<WithHeaders<string>> {
  const headers = new Headers();
  headers.append('vendure-token', p0.customHeaders['vendure-token']);
  const queryOptions: QueryOptions = {
    headers: headers,
  };

  return sdk.GetPasswordResetToken({}, queryOptions).then((res) => {
    const result = Object.assign(res.getPasswordResetToken, {
      _headers: res._headers,
    });
    return result;
  });
}

export async function requestPasswordReset(
  email: string,
): Promise<WithHeaders<RequestPasswordResetMutation['requestPasswordReset']>> {
  const response = await sdk.RequestPasswordReset({ email });
  const { requestPasswordReset, _headers } = response;

  if (!requestPasswordReset) {
    return {
      __typename: 'NativeAuthStrategyError',
      _headers,
    } as WithHeaders<RequestPasswordResetMutation['requestPasswordReset']>;
  }

  return {
    ...requestPasswordReset,
    _headers,
  };
}

export async function resetPassword(
  token: string,
  password: string,
  p0: { request: Request; customHeaders: { 'vendure-token': string } },
): Promise<WithHeaders<any>> {
  const response = await sdk.ResetPassword({
    token,
    password,
  });

  const { resetPassword, _headers } = response;

  if (!resetPassword) {
    return {
      __typename: 'PasswordResetTokenInvalidError',
      _headers,
    };
  }

  return {
    ...resetPassword,
    _headers,
  };
}

export async function sendPhoneOtp(
  phoneNumber: string,
): Promise<string | false> {
  try {
    const response = await sdk.SendPhoneOtp({ phoneNumber });
    const otp = response.sendPhoneOtp;
    console.log('Generated OTP:', otp);
    return otp || false;
  } catch (error) {
    console.error('Error in sendPhoneOtp:', error);
    return false;
  }
}

export async function resendPhoneOtp(
  phoneNumber: string,
): Promise<string | false> {
  try {
    const response = await sdk.resendPhoneOtp({ phoneNumber });
    return response.resendPhoneOtp || false;
  } catch (error) {
    console.error('Error in resendPhoneOtp:', error);
    return false;
  }
}

export async function checkUniquePhone(
  phone: string,
): Promise<WithHeaders<CheckUniquePhoneQuery['checkUniquePhone']>> {
  const response = await sdk.CheckUniquePhone({ phoneNumber: phone });

  const result = Object.assign(response.checkUniquePhone, {
    _headers: response._headers,
  });

  return result;
}

gql`
  query GetChannelsByCustomerEmail($email: String!) {
    getChannelsByCustomerEmail(email: $email) {
      id
      code
      token
      defaultCurrencyCode
    }
  }
`;

gql`
  query GetPasswordResetToken {
    getPasswordResetToken
  }
`;

gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(emailAddress: $email) {
      __typename
    }
  }
`;

gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ... on CurrentUser {
        id
        channels {
          token
          code
          permissions
        }
      }
      ...ErrorResult
      __typename
    }
  }

  fragment ErrorResult on ErrorResult {
    errorCode
    message
    __typename
  }
`;

gql`
  mutation SendPhoneOtp($phoneNumber: String!) {
    sendPhoneOtp(phoneNumber: $phoneNumber)
  }
`;

gql`
  mutation resendPhoneOtp($phoneNumber: String!) {
    resendPhoneOtp(phoneNumber: $phoneNumber)
  }
`;

export async function getChannelsByCustomerPhonenumber(
  phoneNumber: string,
): Promise<
  WithHeaders<
    GetChannelsByCustomerPhonenumberQuery['getChannelsByCustomerPhoneNumber']
  >
> {
  const response = await sdk.getChannelsByCustomerPhonenumber({ phoneNumber });
  const result = Object.assign([...response.getChannelsByCustomerPhoneNumber], {
    _headers: response._headers,
  });
  return result;
}

gql`
  query getChannelsByCustomerPhonenumber($phoneNumber: String!) {
    getChannelsByCustomerPhoneNumber(phoneNumber: $phoneNumber) {
      id
      code
      token
      defaultCurrencyCode
    }
  }
`;

gql`
  query CheckUniquePhone($phoneNumber: String!) {
    checkUniquePhone(phone: $phoneNumber)
  }
`;

export async function getCustomBanners(
  request: Request,
  channelToken?: string,
): Promise<
  { data: CustomBannersQuery['customBanners']; headers: any } | false
> {
  try {
    const customHeaders: Record<string, string> = {};
    if (channelToken) {
      customHeaders['vendure-token'] = channelToken;
    }

    const response = await sdk.customBanners(
      {},
      {
        request,
        customHeaders,
      },
    );

    return {
      data: response.customBanners,
      headers: response._headers,
    };
  } catch (error) {
    console.error('Error in getCustomBanners:', error);
    return false;
  }
}

gql`
  query customBanners {
    customBanners {
      id
      assets {
        id
        name
        source
      }
      channels {
        id
        code
      }
    }
  }
`;

export async function getRazorpayOrderId(
  orderId: number | string,
  request: Request,
  channelToken?: string,
): Promise<
  | {
      razorpayOrderId: string;
      keyId: string;
      keySecret: string;
      headers: any;
    }
  | { message: string; headers: any }
  | false
> {
  try {
    const customHeaders: Record<string, string> = {};
    if (channelToken) {
      customHeaders['vendure-token'] = channelToken;
    }

    const response = await sdk.generateRazorpayOrderId(
      { orderId: String(orderId) },
      {
        request,
        customHeaders,
      },
    );

    const result = response.generateRazorpayOrderId;

    if ('razorpayOrderId' in result) {
      return {
        razorpayOrderId: result.razorpayOrderId,
        keyId: result.keyId,
        keySecret: result.keySecret,
        headers: response._headers,
      };
    } else if ('message' in result) {
      return {
        message: result.message ?? 'Unknown error',
        headers: response._headers,
      };
    }

    return false;
  } catch (error) {
    console.error('Error in getRazorpayOrderId:', error);
    return false;
  }
}

gql`
  mutation generateRazorpayOrderId($orderId: ID!) {
    generateRazorpayOrderId(orderId: $orderId) {
      ... on RazorpayOrderIdSuccess {
        razorpayOrderId
        keyId
        keySecret
      }
      ... on RazorpayOrderIdGenerationError {
        message
      }
    }
  }
`;

export async function cancelOrderOnClientRequest(
  orderId: string,
  value: number,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<
  WithHeaders<CancelOrderOnClientRequestMutation['cancelOrderOnClientRequest']>
> {
  const response = await sdk.CancelOrderOnClientRequest(
    { orderId, value },
    options,
  );

  return Object.assign(response.cancelOrderOnClientRequest, {
    _headers: response._headers,
  });
}

gql`
  mutation CancelOrderOnClientRequest($orderId: ID!, $value: Int!) {
    cancelOrderOnClientRequest(orderId: $orderId, value: $value) {
      ...Cart
    }
  }

  fragment Cart on Order {
    id
    code
    state
    active
    couponCodes
    promotions {
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
    lines {
      id
      customFields
      featuredAsset {
        ...Asset
        __typename
      }
      unitPrice
      unitPriceWithTax
      quantity
      linePriceWithTax
      discountedLinePriceWithTax
      productVariant {
        id
        name
        __typename
      }
      discounts {
        amount
        amountWithTax
        description
        adjustmentSource
        type
        __typename
      }
      __typename
    }
    totalQuantity
    subTotal
    subTotalWithTax
    total
    totalWithTax
    shipping
    shippingWithTax
    shippingLines {
      priceWithTax
      shippingMethod {
        id
        code
        name
        description
        __typename
      }
      __typename
    }
    discounts {
      amount
      amountWithTax
      description
      adjustmentSource
      type
      __typename
    }
    customFields {
      clientRequestToCancel
    }
    __typename
  }

  fragment Asset on Asset {
    id
    width
    height
    name
    preview
    focalPoint {
      x
      y
      __typename
    }
    __typename
  }
`;

export async function otherInstructions(
  orderId: string,
  value: string,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<WithHeaders<OtherInstructionsMutation['otherInstructions']>> {
  const response = await sdk.OtherInstructions({ orderId, value }, options);

  return Object.assign(response.otherInstructions, {
    _headers: response._headers,
  });
}

gql`
  mutation OtherInstructions($orderId: ID!, $value: String!) {
    otherInstructions(orderId: $orderId, value: $value) {
      id
      customFields {
        otherInstructions
      }
    }
  }
`;

// ✅ Favorites feature
export async function toggleFavorite(
  productId: string,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<WithHeaders<ToggleFavoriteMutation['toggleFavorite']>> {
  const response = await sdk.ToggleFavorite({ productId }, options);
  return Object.assign(response.toggleFavorite, {
    _headers: response._headers,
  });
}

gql`
  mutation ToggleFavorite($productId: ID!) {
    toggleFavorite(productId: $productId) {
      items {
        id
        product {
          id
          name
        }
      }
      totalItems
    }
  }
`;

// ✅ Loyalty Points feature
export async function applyLoyaltyPoints(
  amount: number,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<
  WithHeaders<ApplyLoyaltyPointsMutation['applyLoyaltyPointsToActiveOrder']>
> {
  const response = await sdk.ApplyLoyaltyPoints({ amount }, options);

  return Object.assign(response.applyLoyaltyPointsToActiveOrder, {
    _headers: response._headers,
  });
}

gql`
  mutation ApplyLoyaltyPoints($amount: Int!) {
    applyLoyaltyPointsToActiveOrder(amount: $amount) {
      id
      createdAt
      orderPlacedAt
      discounts {
        amountWithTax
      }
      customFields {
        razorpay_order_id
        otherInstructions
        loyaltyPointsEarned
      }
    }
  }
`;

export async function removeLoyaltyPoints(options?: {
  request: Request;
  customHeaders?: Record<string, string>;
}): Promise<
  | (RemoveLoyaltyPointsFromActiveOrderMutation['removeLoyaltyPointsFromActiveOrder'] & {
      _headers: Headers;
    })
  | { __typename: 'Error'; message: string; _headers: Headers }
> {
  const response = await sdk.RemoveLoyaltyPointsFromActiveOrder(
    undefined,
    options,
  );

  const { removeLoyaltyPointsFromActiveOrder, _headers } = response;

  if (!removeLoyaltyPointsFromActiveOrder) {
    return {
      __typename: 'Error',
      message: 'removeLoyaltyPointsFromActiveOrder returned null or undefined',
      _headers,
    };
  }

  return {
    ...removeLoyaltyPointsFromActiveOrder,
    _headers,
  };
}

gql`
  mutation RemoveLoyaltyPointsFromActiveOrder {
    removeLoyaltyPointsFromActiveOrder {
      id
      totalWithTax
      discounts {
        amountWithTax
      }
    }
  }
`;

export async function getLoyaltyPointsConfig(options?: {
  request: Request;
  customHeaders?: Record<string, string>;
}): Promise<WithHeaders<LoyaltyPointsConfig> | undefined> {
  const response = await sdk.LoyaltyPointsConfig(undefined, options);
  if (!response || !response.loyaltyPointsConfig) {
    return undefined;
  }
  return {
    ...response.loyaltyPointsConfig,
    _headers: response._headers,
  };
}

gql`
  query LoyaltyPointsConfig {
    loyaltyPointsConfig {
      id
      createdAt
      updatedAt
      rupeesPerPoint
      pointsPerRupee
      channels {
        id
        code
        token
        availableCurrencyCodes
        createdAt
        currencyCode
        defaultCurrencyCode
        defaultLanguageCode
        pricesIncludeTax
        updatedAt
      }
    }
  }
`;

export async function updateOrderPlacedAtISTMutation(
  orderId: string | number,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<WithHeaders<string>> {
  const response = await sdk.UpdateOrderPlacedAtIST(
    { orderId: String(orderId) },
    options,
  );

  return {
    ...response.updateOrderPlacedAtIST,
    _headers: response._headers,
  };
}

gql`
  mutation UpdateOrderPlacedAtIST($orderId: ID!) {
    updateOrderPlacedAtIST(orderId: $orderId)
  }
`;

export async function getFrequentlyOrderedProducts(options?: {
  request?: Request;
  customHeaders?: Record<string, string>;
}): Promise<
  WithHeaders<GetFrequentlyOrderedProductsQuery['frequentlyOrderedProducts']>
> {
  const response = await sdk.GetFrequentlyOrderedProducts(undefined, options);

  // Attach headers to the result (consistent with your other functions)
  const result = Object.assign([...response.frequentlyOrderedProducts], {
    _headers: response._headers,
  });

  return result;
}

gql`
  query GetFrequentlyOrderedProducts {
    frequentlyOrderedProducts {
      product {
        id
        name
        slug
        variants {
          id
          name
          priceWithTax
          currencyCode
        }
        featuredAsset {
          preview
        }
      }
      orderCount
    }
  }
`;

export async function authenticateWithGoogle(
  token: string,
  options?: { request: Request; customHeaders?: Record<string, string> },
): Promise<WithHeaders<AuthenticateGoogleMutation['authenticate']>> {
  const response = await sdk.AuthenticateGoogle(
    { input: { google: { token } } },
    options,
  );

  return Object.assign(response.authenticate, {
    _headers: response._headers,
  });
}
gql`
  mutation AuthenticateGoogle($input: AuthenticationInput!) {
    authenticate(input: $input) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export async function getCollectionProductsBySlug(
  collectionSlug: string,
): Promise<WithHeaders<CollectionWithProductVariants> | null> {
  const response = await sdk.GetCollectionProductsBySlug({ collectionSlug });

  if (!response.collection) {
    return null;
  }
  return {
    _headers: response._headers,
    ...response.collection,
  } as WithHeaders<CollectionWithProductVariants>;
}

gql`
  query GetCollectionProductsBySlug($collectionSlug: String!) {
    collection(slug: $collectionSlug) {
      id
      name
      slug
      featuredAsset {
        id
        preview
      }
      productVariants {
        items {
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
            variants {
              id
              name
              priceWithTax
              currencyCode
              stockLevel
              sku
            }
          }
        }
      }
    }
  }
`;
