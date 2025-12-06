'use client';

import { type FormEvent, useState, useEffect } from 'react';
import {
  Form,
  useLoaderData,
  useOutletContext,
  useFetcher,
  useNavigate,
} from '@remix-run/react';
import type { OutletContext } from '~/types';
import {
  type DataFunctionArgs,
  json,
  redirect,
} from '@remix-run/server-runtime';
import {
  getAvailableCountries,
  getEligibleShippingMethods,
  getEligiblePaymentMethods,
  createStripePaymentIntent,
  generateBraintreeClientToken,
  getNextOrderStates,
  transitionOrderToState,
  addPaymentToOrder,
} from '~/providers/checkout/checkout';
import {
  getCouponCodeList,
  applyCouponCode,
  removeCouponCode,
  addCouponProductToCart,
  removeCouponProductFromCart,
} from '~/providers/orders/order';
import { shippingFormDataIsValid } from '~/utils/validation';
import { getSessionStorage } from '~/sessions';
import {
  getActiveCustomerAddresses,
  getActiveCustomer,
} from '~/providers/customer/customer';
import { ShippingMethodSelector } from '~/components/checkout/ShippingMethodSelector';
import { ShippingAddressSelector } from '~/components/checkout/ShippingAddressSelector';
import { getActiveOrder } from '~/providers/orders/order';
import { useTranslation } from 'react-i18next';
import { ErrorCode, type ErrorResult } from '~/generated/graphql';
import { CartContents } from '~/components/cart/CartContents';
import { CartTotals } from '~/components/cart/CartTotals';
import { ApplyLoyaltyPoints } from '~/components/cart/ApplyLoyaltyPoints';
import { Link } from '@remix-run/react';
import { RazorpayPayments } from '~/components/checkout/razorpay/RazorpayPayments';
import { OrderInstructions } from '~/components/checkout/OrderInstructions';
import {
  otherInstructions,
  applyLoyaltyPoints,
  removeLoyaltyPoints,
  getLoyaltyPointsConfig,
} from '~/providers/customPlugins/customPlugin';
import { Header } from '~/components/header/Header';
import { getCollections } from '~/providers/collections/collections';
import Footer from '~/components/footer/Footer';
import { CouponModal } from '~/components/couponcode/CouponModal';
import ToastNotification from '~/components/ToastNotification';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { RadioGroup } from '@headlessui/react';
import { classNames } from '~/utils/class-names';
import { CheckCircleIcon, CreditCardIcon } from 'lucide-react';
import { trackCustomEvent } from '~/utils/facebook-pixel';

interface CouponFetcherData {
  success?: boolean;
  message?: string;
  error?: string;
  orderTotal?: number;
  appliedCoupon?: string | null;
}

export async function loader({ request }: DataFunctionArgs) {
  const session = await getSessionStorage().then((sessionStorage) =>
    sessionStorage.getSession(request?.headers.get('Cookie')),
  );
  const activeOrder = await getActiveOrder({ request });
  const collections = await getCollections(request, { take: 20 });
  const couponCodes = await getCouponCodeList({ request });

  if (
    !session ||
    !activeOrder ||
    !activeOrder.active ||
    activeOrder.lines.length === 0
  ) {
    return redirect('/');
  }

  // Fetch loyalty points configuration
  const loyaltyConfig = await getLoyaltyPointsConfig({ request });
  const pointsPerRupee = loyaltyConfig?.pointsPerRupee ?? 100; // Fallback to 100 if undefined

  // Coupon removal logic
  if (activeOrder?.couponCodes && activeOrder.couponCodes.length > 0) {
    const appliedCouponCode = activeOrder.couponCodes[0];
    const appliedCouponDetails = couponCodes.find(
      (c: any) => c.couponCode === appliedCouponCode,
    );

    if (appliedCouponDetails) {
      const couponProductVariantIds: string[] = [];
      let hasProductVariantCondition = false;

      for (const condition of appliedCouponDetails.conditions) {
        const variantArg = condition.args.find(
          (arg: any) => arg.name === 'productVariantIds',
        );
        if (variantArg && variantArg.value) {
          hasProductVariantCondition = true;
          try {
            let parsedIds: string[] | string = variantArg.value;
            if (variantArg.value.startsWith('[')) {
              parsedIds = JSON.parse(variantArg.value);
            } else {
              parsedIds = [variantArg.value];
            }
            if (Array.isArray(parsedIds)) {
              couponProductVariantIds.push(
                ...parsedIds.map((id) => id.toString()),
              );
            } else if (typeof parsedIds === 'string') {
              couponProductVariantIds.push(parsedIds);
            }
          } catch (e) {
            console.error(
              'Failed to parse productVariantIds:',
              variantArg.value,
              e,
            );
          }
        }
      }

      // Only remove the coupon if it has a productVariantIds condition and no matching products are found
      if (hasProductVariantCondition) {
        const hasCouponProducts = activeOrder.lines.some((line) =>
          couponProductVariantIds.includes(line.productVariant.id),
        );

        const hasNonCouponProducts = activeOrder.lines.some(
          (line) => !couponProductVariantIds.includes(line.productVariant.id),
        );

        if (
          !hasCouponProducts &&
          hasNonCouponProducts &&
          activeOrder.lines.length > 0
        ) {
          console.log(
            'No coupon products remaining in cart, removing coupon:',
            appliedCouponCode,
          );
          try {
            await removeCouponCode(appliedCouponCode, { request });
            console.log('Coupon removed successfully');
          } catch (error) {
            console.error('Failed to remove coupon:', error);
          }
        }
      }
    }
  }

  const { availableCountries } = await getAvailableCountries({ request });
  const { eligibleShippingMethods } = await getEligibleShippingMethods({
    request,
  });
  const { activeCustomer } = await getActiveCustomerAddresses({ request });

  // Fetch loyalty points for signed-in user
  let loyaltyPoints = null;
  try {
    const activeCustomerResponse = await getActiveCustomer({ request });
    loyaltyPoints =
      activeCustomerResponse.activeCustomer?.customFields
        ?.loyaltyPointsAvailable ?? null;
  } catch (err) {
    loyaltyPoints = null;
  }

  const { eligiblePaymentMethods } = await getEligiblePaymentMethods({
    request,
  });

  const error = session.get('activeOrderError');

  let stripePaymentIntent: string | undefined;
  let stripePublishableKey: string | undefined;
  let stripeError: string | undefined;
  let brainTreeKey: string | undefined;
  let brainTreeError: string | undefined;
  if (eligiblePaymentMethods.find((method) => method.code.includes('stripe'))) {
    try {
      const stripePaymentIntentResult = await createStripePaymentIntent({
        request,
      });
      const intentDataRaw = stripePaymentIntentResult.createStripePaymentIntent;
      let intentData: Record<string, any> = {};
      if (
        intentDataRaw &&
        typeof intentDataRaw === 'object' &&
        !Array.isArray(intentDataRaw)
      ) {
        intentData = intentDataRaw as Record<string, any>;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('Stripe intentData keys:', Object.keys(intentData));
      }
      stripePaymentIntent =
        intentData['paymentIntent'] ?? intentData['clientSecret'] ?? '';
      stripePublishableKey =
        intentData['publishableKey'] ??
        intentData['stripePublishableKey'] ??
        '';
      stripeError =
        intentData['error'] ?? intentData['stripeError'] ?? undefined;
    } catch (e: any) {
      stripeError = e.message;
    }
  }
  if (
    eligiblePaymentMethods.find((method) => method.code.includes('braintree'))
  ) {
    try {
      const generateBrainTreeTokenResult = await generateBraintreeClientToken({
        request,
      });
      brainTreeKey =
        generateBrainTreeTokenResult.generateBraintreeClientToken ?? '';
    } catch (e: any) {
      brainTreeError = e.message;
    }
  }

  const orderInstructions = activeOrder?.customFields?.otherInstructions || '';

  return json({
    availableCountries,
    eligibleShippingMethods,
    activeCustomer,
    error,
    activeOrder,
    collections,
    eligiblePaymentMethods,
    stripePaymentIntent,
    stripePublishableKey,
    stripeError,
    brainTreeKey,
    brainTreeError,
    orderInstructions,
    couponCodes,
    loyaltyPoints,
    pointsPerRupee,
  });
}

export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData();
  const action = body.get('action');
  const activeOrder = await getActiveOrder({ request });

  if (action === 'applyLoyaltyPoints') {
    const amount = Number(body.get('amount'));
    if (!amount || isNaN(amount) || amount <= 0) {
      return json(
        { success: false, error: 'Invalid points amount.' },
        { status: 400 },
      );
    }
    try {
      const result = await applyLoyaltyPoints(amount, { request });
      if (result && result.id) {
        return json({ success: true });
      } else {
        return json(
          { success: false, error: 'Failed to apply loyalty points.' },
          { status: 400 },
        );
      }
    } catch (e: any) {
      return json(
        {
          success: false,
          error: e?.message || 'Error applying loyalty points.',
        },
        { status: 400 },
      );
    }
  }

  if (action === 'removeLoyaltyPoints') {
    try {
      const result = await removeLoyaltyPoints({ request });
      if (result && result.__typename === 'Order' && result.id) {
        return json({ success: true });
      } else {
        return json(
          {
            success: false,
            error:
              (result as any)?.message || 'Failed to remove loyalty points.',
          },
          { status: 400 },
        );
      }
    } catch (e: any) {
      return json(
        {
          success: false,
          error: e?.message || 'Error removing loyalty points.',
        },
        { status: 400 },
      );
    }
  }

  if (action === 'setOrderCustomer' || action === 'setCheckoutShipping') {
    return json({ success: true });
  }

  if (action === 'updateOrderInstructions') {
    const orderId = body.get('orderId');
    const instructions = body.get('instructions');
    if (typeof orderId === 'string' && typeof instructions === 'string') {
      try {
        await otherInstructions(orderId, instructions, { request });
        return json({ success: true });
      } catch (error) {
        return json({ success: false, error: 'Failed to save instructions' });
      }
    }
    return json({ success: false, error: 'Invalid data' });
  }

  if (action === 'applyCoupon') {
    const couponCode = body.get('couponCode') as string;
    if (!couponCode) {
      return json(
        { success: false, error: 'Coupon code is required.' },
        { status: 400 },
      );
    }

    const couponCodes = await getCouponCodeList({ request });
    const coupon = couponCodes.find((c: any) => c.couponCode === couponCode);

    if (!coupon || !coupon.couponCode) {
      console.error(`Invalid coupon code: ${couponCode}`);
      return json(
        { success: false, error: 'Invalid coupon code.' },
        { status: 400 },
      );
    }

    if (activeOrder?.couponCodes && activeOrder.couponCodes.length > 0) {
      console.error(
        `Another coupon already applied: ${activeOrder.couponCodes}`,
      );
      return json(
        {
          success: false,
          error:
            'Another coupon is already applied. Please remove it before applying a new one.',
        },
        { status: 400 },
      );
    }

    const minAmountCondition = coupon.conditions.find(
      (c: any) =>
        c.code === 'minimum_order_amount' ||
        c.code === 'minimumOrderAmount' ||
        c.code === 'minimumAmount',
    );

    if (minAmountCondition) {
      const amountArg =
        minAmountCondition.args.find((a: any) => a.name === 'amount') ??
        minAmountCondition.args[0];
      const minAmountPaise = Number.parseInt(amountArg.value, 10) || 0;
      const totalWithTaxPaise = activeOrder?.totalWithTax ?? 0;

      if (totalWithTaxPaise < minAmountPaise) {
        const diffPaise = minAmountPaise - totalWithTaxPaise;
        const diffRupees = (diffPaise / 100).toFixed(2);
        console.error(
          `Order total too low: ${totalWithTaxPaise} < ${minAmountPaise}`,
        );
        return json(
          {
            success: false,
            error: `Add ₹${diffRupees} more to apply this coupon. Current total: ₹${(
              totalWithTaxPaise / 100
            ).toFixed(2)}.`,
          },
          { status: 400 },
        );
      }
    }

    let hasProductVariant = false;
    const productVariantIds: string[] = [];

    for (const condition of coupon.conditions) {
      const variantArg = condition.args.find(
        (arg: any) => arg.name === 'productVariantIds',
      );
      if (variantArg && variantArg.value) {
        hasProductVariant = true;
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
          return json(
            {
              success: false,
              error: `Invalid productVariantIds format for coupon ${couponCode}`,
            },
            { status: 400 },
          );
        }
        break;
      }
    }

    console.log(`Applying coupon: ${couponCode}`);
    const couponResult = await applyCouponCode(couponCode, { request });
    console.log('applyCouponCode result:', couponResult);

    if (couponResult?.__typename !== 'Order') {
      if (couponResult.__typename === 'CouponCodeExpiredError') {
        const message = (couponResult as any).message ?? 'Coupon has expired.';
        console.error(message);
        return json({ success: false, error: message }, { status: 400 });
      } else if (couponResult.__typename === 'CouponCodeInvalidError') {
        const message =
          (couponResult as any).message ?? 'Coupon code is invalid.';
        console.error(message);
        return json({ success: false, error: message }, { status: 400 });
      } else if (couponResult.__typename === 'CouponCodeLimitError') {
        const message =
          (couponResult as any).message ?? 'Coupon usage limit reached.';
        console.error(message);
        return json({ success: false, error: message }, { status: 400 });
      }
      console.error('Unexpected response from applyCouponCode');
      return json(
        { success: false, error: 'Unexpected response from server.' },
        { status: 500 },
      );
    }

    const order = couponResult as any;
    const cartItems = activeOrder?.lines ?? [];
    console.log('Current cart items:', cartItems);

    if (hasProductVariant && productVariantIds.length > 0) {
      console.log(`Calling addCouponProductToCart for ${couponCode}`);
      try {
        const addResult = await addCouponProductToCart(couponCode, { request });
        console.log('addCouponProductToCart result:', addResult);
      } catch (error) {
        console.error('Failed to add products, removing coupon:', couponCode);
        await removeCouponCode(couponCode, { request });
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to add products to cart: ${errorMessage}`);
        return json(
          {
            success: false,
            error: `Failed to add products to cart: ${errorMessage}`,
          },
          { status: 400 },
        );
      }
    } else {
      console.log(
        `No productVariantIds for coupon ${couponCode}, skipping product addition`,
      );
    }

    return json({
      success: true,
      message: hasProductVariant
        ? `Coupon "${couponCode}" applied and ${
            productVariantIds.length
          } product${
            productVariantIds.length > 1 ? 's' : ''
          } added to your order!`
        : `Coupon "${couponCode}" applied to your order!`,
      orderTotal: order.totalWithTax,
      appliedCoupon: couponCode,
    });
  }

  if (action === 'removeCoupon') {
    const couponCode = body.get('couponCode') as string;
    if (!couponCode) {
      return json(
        { success: false, error: 'Coupon code is required.' },
        { status: 400 },
      );
    }

    const couponCodes = await getCouponCodeList({ request });
    const coupon = couponCodes.find((c: any) => c.couponCode === couponCode);

    if (!coupon || !coupon.couponCode) {
      console.error(`Invalid coupon code for removal: ${couponCode}`);
      return json(
        { success: false, error: 'Invalid coupon code.' },
        { status: 400 },
      );
    }

    if (!activeOrder?.couponCodes?.includes(couponCode)) {
      console.error(`Coupon ${couponCode} not applied to order`);
      return json(
        { success: false, error: 'Coupon code is not applied to the order.' },
        { status: 400 },
      );
    }

    let hasProductVariant = false;
    const productVariantIds: string[] = [];

    for (const condition of coupon.conditions) {
      const variantArg = condition.args.find(
        (arg: any) => arg.name === 'productVariantIds',
      );
      if (variantArg && variantArg.value) {
        hasProductVariant = true;
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
          return json(
            {
              success: false,
              error: `Invalid productVariantIds format for coupon ${couponCode}`,
            },
            { status: 400 },
          );
        }
        break;
      }
    }

    if (hasProductVariant) {
      console.log(`Adjusting coupon product quantities for: ${couponCode}`);
      try {
        await removeCouponProductFromCart(couponCode, { request });
        console.log('Coupon product quantities adjusted successfully');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Failed to adjust product quantities in cart: ${errorMessage}`,
        );
      }
    } else {
      console.log(
        `No productVariantIds for coupon ${couponCode}, skipping product quantity adjustment`,
      );
    }

    console.log(`Removing coupon: ${couponCode}`);
    const result = await removeCouponCode(couponCode, { request });
    console.log('removeCouponCode result:', result);

    if (result?.__typename === 'Order') {
      const order = result as any;
      return json({
        success: true,
        message: hasProductVariant
          ? `Coupon removed and ${productVariantIds.length} product${
              productVariantIds.length > 1 ? 's' : ''
            } quantity adjusted in your order.`
          : 'Coupon removed from your order.',
        orderTotal: order.totalWithTax,
        appliedCoupon: null,
      });
    } else {
      console.error('Failed to remove coupon');
      return json(
        { success: false, error: 'Failed to remove coupon.' },
        { status: 400 },
      );
    }
  }

  const paymentMethodCode = body.get('paymentMethodCode');
  const paymentNonce = body.get('paymentNonce');

  if (typeof paymentMethodCode === 'string') {
    const { nextOrderStates } = await getNextOrderStates({
      request,
    });

    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
        { request },
      );
      if (transitionResult.transitionOrderToState?.__typename !== 'Order') {
        throw new Response('Not Found', {
          status: 400,
          statusText: transitionResult.transitionOrderToState?.message,
        });
      }
    }

    let metadata = {};
    if (paymentMethodCode === 'online' && paymentNonce) {
      try {
        const paymentData = JSON.parse(paymentNonce as string);
        metadata = {
          method: 'online',
          amount: (Number(paymentData.amount) / 100).toFixed(2) || 0,
          currencyCode: paymentData.currencyCode || 'INR',
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_signature: paymentData.razorpay_signature,
          orderCode: paymentData.orderCode,
        };
      } catch (e) {
        console.error('Error parsing payment nonce:', e);
        metadata = { nonce: paymentNonce };
      }
    }

    console.log('Adding payment to order with:', {
      method: paymentMethodCode,
      metadata,
    });

    const result = await addPaymentToOrder(
      { method: paymentMethodCode, metadata },
      { request },
    );

    if (result.addPaymentToOrder.__typename === 'Order') {
      return redirect(
        `/checkout/confirmation/${result.addPaymentToOrder.code}`,
      );
    } else {
      throw new Response('Not Found', {
        status: 400,
        statusText: result.addPaymentToOrder?.message,
      });
    }
  }

  return json({ success: false });
}

export default function CheckoutPage() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    collections,
    availableCountries,
    eligibleShippingMethods,
    activeCustomer,
    error,
    activeOrder,
    eligiblePaymentMethods,
    orderInstructions,
    couponCodes,
    loyaltyPoints,
    pointsPerRupee,
  } = loaderData;

  const {
    activeOrderFetcher,
    removeItem: originalRemoveItem,
    adjustOrderLine: originalAdjustOrderLine,
  } = useOutletContext<OutletContext>();

  const [customerFormChanged, setCustomerFormChanged] = useState(false);
  const [addressFormChanged, setAddressFormChanged] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'online' | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [showAllCartItems, setShowAllCartItems] = useState(false);
  const [shouldRefreshAfterCouponRemoval, setShouldRefreshAfterCouponRemoval] =
    useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [showAddressToast, setShowAddressToast] = useState(false);

  const couponFetcher = useFetcher<CouponFetcherData>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Track checkout page view
  useEffect(() => {
    trackCustomEvent('InitiateCheckout', {
      value: activeOrder?.totalWithTax
        ? (activeOrder.totalWithTax / 100).toFixed(2)
        : '0',
      currency: activeOrder?.currencyCode || 'INR',
      num_items: activeOrder?.totalQuantity || 0,
    });
  }, [activeOrder]);

  const { customer, shippingAddress } = activeOrder ?? {};
  const isSignedIn = !!activeCustomer?.id;
  const addresses = activeCustomer?.addresses ?? [];

  const defaultFullName =
    shippingAddress?.fullName ??
    (customer ? `${customer.firstName} ${customer.lastName}` : ``);

  const submitCustomerForm = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const { emailAddress, firstName, lastName } = Object.fromEntries<any>(
      formData.entries(),
    );
    const isValid = event.currentTarget.checkValidity();

    if (
      customerFormChanged &&
      isValid &&
      emailAddress &&
      firstName &&
      lastName
    ) {
      activeOrderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
      setCustomerFormChanged(false);
    }
  };

  const submitAddressForm = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const isValid = event.currentTarget.checkValidity();
    if (addressFormChanged && isValid) {
      setShippingAddress(formData);
    }
  };

  const submitSelectedAddress = (index: number) => {
    const selectedAddress = activeCustomer?.addresses?.[index];
    if (selectedAddress) {
      setSelectedAddressIndex(index);
      const formData = new FormData();
      Object.keys(selectedAddress).forEach((key) =>
        formData.append(key, (selectedAddress as any)[key]),
      );
      formData.append('countryCode', selectedAddress.country.code);
      formData.append('action', 'setCheckoutShipping');
      setShippingAddress(formData);
    }
  };

  function setShippingAddress(formData: FormData) {
    if (shippingFormDataIsValid(formData)) {
      activeOrderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
      setAddressFormChanged(false);
    }
  }

  const submitSelectedShippingMethod = (value?: string) => {
    if (value) {
      activeOrderFetcher.submit(
        {
          action: 'setShippingMethod',
          shippingMethodId: value,
        },
        {
          method: 'post',
          action: '/api/active-order',
        },
      );
    }
  };

  const paymentError = getPaymentError(error);

  useEffect(() => {
    if (
      isSignedIn &&
      activeCustomer?.addresses?.length &&
      !addressFormChanged &&
      !shippingAddress?.streetLine1
    ) {
      const defaultShippingAddress = activeCustomer.addresses.find(
        (addr) => addr.defaultShippingAddress,
      );
      const addressToShow =
        defaultShippingAddress || activeCustomer.addresses[0];
      if (addressToShow) {
        const formData = new FormData();
        Object.keys(addressToShow).forEach((key) =>
          formData.append(key, (addressToShow as any)[key]),
        );
        formData.append('countryCode', addressToShow.country.code);
        formData.append('action', 'setCheckoutShipping');
        setShippingAddress(formData);
      }
    }
  }, [
    isSignedIn,
    activeCustomer?.addresses,
    addressFormChanged,
    shippingAddress?.streetLine1,
  ]);

  const isShippingMethodSelected =
    !!activeOrder?.shippingLines?.[0]?.shippingMethod;

  const [open, setOpen] = useState(false);

  const appliedCouponCode = activeOrder?.couponCodes?.[0];
  const appliedCouponDetails = appliedCouponCode
    ? couponCodes.find((c: any) => c.couponCode === appliedCouponCode)
    : null;

  const couponProductVariantIds = (
    appliedCouponDetails?.conditions || []
  ).flatMap((condition: any) => {
    const arg = condition.args.find((a: any) => a.name === 'productVariantIds');
    if (arg && arg.value) {
      try {
        if (arg.value.startsWith('[')) {
          return JSON.parse(arg.value);
        } else {
          return [arg.value];
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  function handleRemoveItem(lineId: string) {
    const line = activeOrder?.lines.find((l) => l.id === lineId);
    const isCouponProduct =
      line &&
      couponProductVariantIds
        .map(String)
        .includes(String(line.productVariant.id));

    console.log(
      'Removing line:',
      lineId,
      'isCouponProduct:',
      isCouponProduct,
      'appliedCouponCode:',
      appliedCouponCode,
    );

    const isLastItem = activeOrder?.lines.length === 1;
    if (isLastItem) {
      setIsNavigatingToHome(true);
    }

    originalRemoveItem(lineId);

    if (isCouponProduct && appliedCouponCode) {
      couponFetcher.submit(
        {
          action: 'removeCoupon',
          couponCode: appliedCouponCode,
        },
        { method: 'post' },
      );
      setShouldRefreshAfterCouponRemoval(true);
    }
  }

  function handleAdjustOrderLine(lineId: string, quantity: number) {
    const isLastItem = activeOrder?.lines.length === 1;
    const willBeEmpty = isLastItem && quantity <= 0;

    if (willBeEmpty) {
      setIsNavigatingToHome(true);
    }

    originalAdjustOrderLine(lineId, quantity);
  }

  const handleOpenCouponModal = () => {
    setTimeout(() => {
      setIsCouponModalOpen(true);
    }, 50);
  };

  useEffect(() => {
    if (
      couponFetcher.data?.success &&
      couponFetcher.data?.appliedCoupon === null &&
      shouldRefreshAfterCouponRemoval
    ) {
      activeOrderFetcher.load('/api/active-order');
      setShouldRefreshAfterCouponRemoval(false);
    }
  }, [couponFetcher.data, shouldRefreshAfterCouponRemoval, activeOrderFetcher]);

  useEffect(() => {
    if (activeOrder && activeOrder.lines.length === 0 && isNavigatingToHome) {
      const timer = setTimeout(() => {
        navigate('/');
        setIsNavigatingToHome(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, isNavigatingToHome, navigate]);

  useEffect(() => {
    if (
      (!activeOrder || activeOrder.lines.length === 0) &&
      !isNavigatingToHome
    ) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, isNavigatingToHome, navigate]);

  const allLines = activeOrder?.lines ?? [];
  const visibleLines = showAllCartItems ? allLines : allLines.slice(0, 3);

  if (isNavigatingToHome) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (!activeOrder || activeOrder.lines.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 bg-amber-100">
      <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
        <h1 className="mt-3 text-center mb-10 text-amber-800 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Checkout Page
        </h1>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div>
            <Form
              method="post"
              action="/api/active-order"
              onBlur={submitAddressForm}
              onChange={() => setAddressFormChanged(true)}
            >
              <input type="hidden" name="action" value="setCheckoutShipping" />
              <div className=""></div>
              {isSignedIn && activeCustomer.addresses?.length ? (
                <div className=" bg-white border rounded-lg shadow-sm p-4">
                  {(() => {
                    const defaultShippingAddress =
                      activeCustomer.addresses.find(
                        (addr) => addr.defaultShippingAddress,
                      );
                    const addressToShow =
                      defaultShippingAddress || activeCustomer.addresses[0];
                    return (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg uppercase font-bold text-amber-900">
                            {defaultShippingAddress
                              ? ' Shipping to'
                              : 'Saved Address'}
                          </h3>
                          <Link
                            to="/account/addresses"
                            className="text-sm font-medium text-black"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="text-sm text-black leading-5">
                          <p className="font-medium">
                            {addressToShow?.fullName} •{' '}
                            {addressToShow?.phoneNumber}
                          </p>
                          <p className="text-black">
                            {[
                              addressToShow?.streetLine1,
                              addressToShow?.streetLine2,
                              addressToShow?.city,
                              addressToShow?.province,
                              addressToShow?.postalCode,
                              addressToShow?.country?.name,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                  {addressFormChanged && (
                    <div className=" border-t border-black">
                      <h3 className="text-sm font-medium text-black mb-4">
                        Select Another Address
                      </h3>
                      <ShippingAddressSelector
                        addresses={activeCustomer.addresses}
                        selectedAddressIndex={selectedAddressIndex}
                        onChange={submitSelectedAddress}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 bg-white border rounded-lg shadow-sm p-4 text-black">
                  <p className="mb-4">You have no saved address yet.</p>
                  <Link
                    to="/account/addresses/new?redirectTo=/checkout"
                    className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-sm font-medium"
                  >
                    Add Address
                  </Link>
                </div>
              )}
            </Form>
            {activeOrder?.id && (
              <div className="my-5">
                <OrderInstructions
                  orderId={activeOrder.id}
                  initialValue={orderInstructions}
                  disabled={false}
                />
              </div>
            )}
            <div className="">
              <ShippingMethodSelector
                eligibleShippingMethods={eligibleShippingMethods}
                currencyCode={activeOrder?.currencyCode}
                shippingMethodId={
                  activeOrder?.shippingLines[0]?.shippingMethod.id ?? ''
                }
                onChange={(value?: string) => {
                  if (!isSignedIn || !activeCustomer.addresses?.length) {
                    setShowAddressToast(true);
                    return;
                  }
                  submitSelectedShippingMethod(value);
                }}
              />
            </div>
            <div className="mt-8">
              {/* 1. Using the same consistent header style */}
              <h3 className="text-lg font-semibold text-stone-800 border-b pb-2 mb-4">
                Payment Method
              </h3>

              {/* 2. Switched to RadioGroup for consistency and scalability */}
              <RadioGroup value={paymentMode} onChange={setPaymentMode}>
                <div className="space-y-4">
                  <RadioGroup.Option
                    value="online"
                    className={({ checked }) =>
                      classNames(
                        'relative flex cursor-pointer rounded-lg p-4 border-2 transition-all duration-200 ease-in-out',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
                        // 3. Applying the same styles as the shipping method
                        checked
                          ? 'bg-amber-50 border-amber-600 shadow-md' // Selected state
                          : 'bg-white border-stone-200 hover:border-amber-500', // Default state
                      )
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <CreditCardIcon
                              className={classNames(
                                'h-8 w-8',
                                checked ? 'text-amber-700' : 'text-stone-400',
                              )}
                            />
                            <div className="flex flex-col">
                              <RadioGroup.Label
                                as="span"
                                className={classNames(
                                  'block text-sm font-semibold',
                                  checked ? 'text-amber-900' : 'text-stone-800',
                                )}
                              >
                                Online Payment
                              </RadioGroup.Label>
                              {/* 4. Added a helpful description */}
                              <RadioGroup.Description
                                as="span"
                                className={classNames(
                                  'text-xs',
                                  checked ? 'text-amber-800' : 'text-stone-500',
                                )}
                              >
                                Pay with UPI, Cards, Net Banking, etc.
                              </RadioGroup.Description>
                            </div>
                          </div>
                          {checked && (
                            <CheckCircleIcon
                              className="h-6 w-6 text-amber-600"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>

                  {/* You can easily add other payment methods like COD here in the future */}
                </div>
              </RadioGroup>

              {paymentError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{paymentError}</p>
                </div>
              )}
            </div>

            {eligibleShippingMethods.length === 0 && (
              <div className="mt-10 border-t border-black pt-10">
                <p className="text-sm text-red-800">
                  No shipping methods available. Please contact support.
                </p>
              </div>
            )}
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="bg-white bg-transparent  p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-medium text-black mb-6">Summary</h2>

              {loyaltyPoints && activeOrder?.id ? (
                <ApplyLoyaltyPoints
                  availablePoints={loyaltyPoints}
                  orderId={activeOrder.id}
                  pointsPerRupee={pointsPerRupee}
                />
              ) : null}
              <CartTotals order={activeOrder as any} />
              <CartContents
                orderLines={visibleLines}
                currencyCode={activeOrder?.currencyCode!}
                editable={true}
                removeItem={handleRemoveItem}
                adjustOrderLine={handleAdjustOrderLine}
              />
              {allLines.length > 3 && !showAllCartItems && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition flex items-center justify-center"
                    onClick={() => setShowAllCartItems(true)}
                    aria-label="View More"
                  >
                    <img
                      src="/show-more.png"
                      alt="Show more"
                      className="w-6 h-6"
                    />
                  </button>
                </div>
              )}
              {allLines.length > 3 && showAllCartItems && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition flex items-center justify-center"
                    onClick={() => setShowAllCartItems(false)}
                    aria-label="Show Less"
                  >
                    <img
                      src="/show-more.png"
                      alt="Show less"
                      className="w-6 h-6 transform rotate-180"
                      style={{ transform: 'rotate(180deg)' }}
                    />
                  </button>
                </div>
              )}
              {appliedCouponCode && appliedCouponDetails && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {appliedCouponDetails.name || appliedCouponCode}
                        </p>
                        <p className="text-xs text-green-600">
                          Coupon "{appliedCouponCode}" applied
                        </p>
                      </div>
                    </div>
                    <couponFetcher.Form method="post">
                      <input type="hidden" name="action" value="removeCoupon" />
                      <input
                        type="hidden"
                        name="couponCode"
                        value={appliedCouponCode}
                      />
                      <button
                        type="submit"
                        onClick={() => setShouldRefreshAfterCouponRemoval(true)}
                        className="ml-2 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs hover:bg-red-200 transition-colors duration-200"
                        title="Remove coupon"
                        disabled={couponFetcher.state === 'submitting'}
                      >
                        {couponFetcher.state === 'submitting'
                          ? 'Removing...'
                          : 'Remove'}
                      </button>
                    </couponFetcher.Form>
                  </div>
                </div>
              )}
              {!appliedCouponCode && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleOpenCouponModal}
                    className="w-full bg-amber-800 border-2 border-amber-950 text-white font-medium py-2 px-4  rounded-md  hover:border-black  transition-colors duration-200"
                  >
                    Apply Coupon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="py-6 w-full">
          <h3 className="text-base font-medium text-black mb-4">Review</h3>
          <p className="text-sm text-black mb-4">
            By clicking the Place Order button, you confirm that you have read,
            understand and accept our Terms of Use, Terms of Sale and Returns
            Policy and acknowledge that you have read SouthMithai Store's
            Privacy Policy.
          </p>
          {isShippingMethodSelected && paymentMode && (
            <>
              {eligiblePaymentMethods
                .filter((method) => method.code === paymentMode)
                .map((method) => (
                  <div key={method.id}>
                    {method.code === 'online' ? (
                      <>
                        <RazorpayPayments
                          orderCode={activeOrder?.code ?? ''}
                          amount={activeOrder?.totalWithTax ?? 0}
                          currencyCode={activeOrder?.currencyCode ?? 'INR'}
                          customerEmail={customer?.emailAddress ?? ''}
                          customerName={`${customer?.firstName ?? ''} ${
                            customer?.lastName ?? ''
                          }`.trim()}
                          customerPhone={shippingAddress?.phoneNumber ?? ''}
                        />
                      </>
                    ) : (
                      <div className="text-sm text-black">
                        Payment method "{method.code}" not supported
                      </div>
                    )}
                  </div>
                ))}
              {!eligiblePaymentMethods.find((m) => m.code === paymentMode) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Online payment is not available. Please contact support if
                    you need to pay online.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupons={couponCodes}
        activeOrder={activeOrder as any}
        appliedCoupon={activeOrder?.couponCodes?.[0] || null}
      />
      <ToastNotification
        show={showAddressToast}
        type="error"
        title="Address Required"
        message="Address is required to place an order."
        onClose={() => setShowAddressToast(false)}
      />
    </div>
  );
}

function getPaymentError(error?: ErrorResult): string | undefined {
  if (!error || !error.errorCode) {
    return undefined;
  }
  switch (error.errorCode) {
    case ErrorCode.OrderPaymentStateError:
    case ErrorCode.IneligiblePaymentMethodError:
    case ErrorCode.PaymentFailedError:
    case ErrorCode.PaymentDeclinedError:
    case ErrorCode.OrderStateTransitionError:
    case ErrorCode.NoActiveOrderError:
      return error.message;
  }
}
