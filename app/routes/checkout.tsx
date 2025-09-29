'use client';
import { type FormEvent, useState, useEffect, useRef } from 'react';
import {
  Form,
  useLoaderData,
  useNavigate,
  useFetcher,
  useRevalidator,
} from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/server-runtime';
import { Link } from '@remix-run/react';
import { json, redirect } from '@remix-run/server-runtime';
import {
  getAvailableCountries,
  getEligibleShippingMethods,
  getEligiblePaymentMethods,
  createStripePaymentIntent,
  generateBraintreeClientToken,
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
import { getActiveOrder } from '~/providers/orders/order';
import { useTranslation } from 'react-i18next';
import { getCollections } from '~/providers/collections/collections';
import { CartContents } from '~/components/cart/CartContents';
import { CartTotals } from '~/components/cart/CartTotals';
import { ApplyLoyaltyPoints } from '~/components/cart/ApplyLoyaltyPoints';
import { AddressForm } from '~/components/account/AddressForm';
import { ShippingMethodSelector } from '~/components/checkout/ShippingMethodSelector';
import { ShippingAddressSelector } from '~/components/checkout/ShippingAddressSelector';
import AddAddressCard from '~/components/account/AddAddressCard';
import { OrderInstructions } from '~/components/checkout/OrderInstructions';
import { CouponModal } from '~/components/couponcode/CouponModal';
import ToastNotification from '~/components/ToastNotification';
import {
  otherInstructions,
  applyLoyaltyPoints,
  removeLoyaltyPoints,
  getLoyaltyPointsConfig,
} from '~/providers/customPlugins/customPlugin';
import PaymentStep from './checkout.payment';
import classNames from 'classnames'; // Added classNames import

// Define AddressType interface based on your data structure
interface AddressType {
  id: string;
  fullName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: { code: string; name: string };
  defaultShippingAddress: boolean;
}

const steps = ['shipping-cart', 'payment', 'confirmation'];

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

  const { availableCountries } = await getAvailableCountries({ request });
  const { eligibleShippingMethods } = await getEligibleShippingMethods({
    request,
  });
  const { activeCustomer } = await getActiveCustomerAddresses({ request });
  const { eligiblePaymentMethods } = await getEligiblePaymentMethods({
    request,
  });

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
  const loyaltyConfig = await getLoyaltyPointsConfig({ request });
  const pointsPerRupee = loyaltyConfig?.pointsPerRupee ?? 100;

  let loyaltyPoints = null;
  try {
    const activeCustomerResponse = await getActiveCustomer({ request });
    loyaltyPoints =
      activeCustomerResponse.activeCustomer?.customFields
        ?.loyaltyPointsAvailable ?? null;
  } catch (err) {
    loyaltyPoints = null;
  }

  return json({
    availableCountries,
    eligibleShippingMethods,
    activeCustomer,
    error: session.get('activeOrderError'),
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
      return json(
        { success: false, error: 'Invalid coupon code.' },
        { status: 400 },
      );
    }

    if (activeOrder?.couponCodes && activeOrder.couponCodes.length > 0) {
      return json(
        {
          success: false,
          error:
            'Another coupon is already applied. Please remove it before applying a new one.',
        },
        { status: 400 },
      );
    }

    // Minimum order amount validation
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

    // Extract productVariantIds if present
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

    // Apply coupon
    const couponResult = await applyCouponCode(couponCode, { request });
    if ((couponResult as any)?.__typename !== 'Order') {
      const message =
        (couponResult as any)?.message || 'Failed to apply coupon.';
      return json({ success: false, error: message }, { status: 400 });
    }

    // Add coupon products if any
    if (hasProductVariant && productVariantIds.length > 0) {
      try {
        await addCouponProductToCart(couponCode, { request });
      } catch (error: any) {
        await removeCouponCode(couponCode, { request });
        return json(
          {
            success: false,
            error: `Failed to add products to cart: ${
              error?.message || 'Unknown error'
            }`,
          },
          { status: 400 },
        );
      }
    }

    return json({ success: true, appliedCoupon: couponCode });
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
      return json(
        { success: false, error: 'Invalid coupon code.' },
        { status: 400 },
      );
    }
    if (!activeOrder?.couponCodes?.includes(couponCode)) {
      return json(
        { success: false, error: 'Coupon code is not applied to the order.' },
        { status: 400 },
      );
    }

    // If coupon has productVariantIds, remove those items first
    let hasProductVariant = false;
    for (const condition of coupon.conditions) {
      const variantArg = condition.args.find(
        (arg: any) => arg.name === 'productVariantIds',
      );
      if (variantArg && variantArg.value) {
        hasProductVariant = true;
        break;
      }
    }
    if (hasProductVariant) {
      try {
        await removeCouponProductFromCart(couponCode, { request });
      } catch (error) {
        // proceed even if this fails
      }
    }

    const result = await removeCouponCode(couponCode, { request });
    if ((result as any)?.__typename === 'Order' || (result as any)?.id) {
      return json({ success: true, appliedCoupon: null });
    }
    return json(
      {
        success: false,
        error: (result as any)?.message || 'Failed to remove coupon.',
      },
      { status: 400 },
    );
  }

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
      }
      return json(
        { success: false, error: 'Failed to apply loyalty points.' },
        { status: 400 },
      );
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
      }
      return json(
        {
          success: false,
          error: (result as any)?.message || 'Failed to remove loyalty points.',
        },
        { status: 400 },
      );
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

  return json({ success: false });
}

export default function CheckoutPage() {
  const loaderData = useLoaderData<typeof loader>();
  const {
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
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isSignedIn = !!activeCustomer?.id;

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    if (!activeOrder || activeOrder.lines.length === 0) {
      navigate('/');
    }
  }, [activeOrder, navigate]);

  const renderStep = () => {
    switch (steps[currentStep]) {
      case 'shipping-cart':
        return (
          <ShippingCartStep
            availableCountries={availableCountries}
            eligibleShippingMethods={eligibleShippingMethods}
            activeCustomer={activeCustomer}
            activeOrder={activeOrder}
            error={error}
            orderInstructions={orderInstructions}
            couponCodes={couponCodes}
            loyaltyPoints={loyaltyPoints}
            pointsPerRupee={pointsPerRupee}
            onNext={nextStep}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            eligiblePaymentMethods={eligiblePaymentMethods}
            activeOrder={activeOrder}
            stripePaymentIntent={loaderData.stripePaymentIntent}
            stripePublishableKey={loaderData.stripePublishableKey}
            stripeError={loaderData.stripeError}
            brainTreeKey={loaderData.brainTreeKey}
            brainTreeError={loaderData.brainTreeError}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      default:
        return null; // Confirmation step will be handled separately
    }
  };

  return (
    <div>
      <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center">
                <span
                  className={`h-6 w-6 flex items-center justify-center rounded-full ${
                    currentStep >= index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`ml-4 text-sm font-medium ${
                    currentStep >= index ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step === 'shipping-cart'
                    ? 'Shipping & Cart'
                    : step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
                {index < steps.length - 1 && (
                  <svg
                    className="w-4 h-4 ml-2 text-gray-300"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1l4 4-4 4"
                    />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {renderStep()}
      </div>
    </div>
  );
}

function ShippingCartStep({
  availableCountries,
  eligibleShippingMethods,
  activeCustomer,
  activeOrder,
  error,
  orderInstructions,
  couponCodes,
  loyaltyPoints,
  pointsPerRupee,
  onNext,
}: {
  availableCountries: any[];
  eligibleShippingMethods: any[];
  activeCustomer: any;
  activeOrder: any;
  error: any;
  orderInstructions: string;
  couponCodes: any[];
  loyaltyPoints: number | null;
  pointsPerRupee: number;
  onNext: () => void;
}) {
  const [customerFormChanged, setCustomerFormChanged] = useState(false);
  const [addressFormChanged, setAddressFormChanged] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [showAllCartItems, setShowAllCartItems] = useState(false);
  const [showAddressToast, setShowAddressToast] = useState(false);
  const couponFetcher = useFetcher();
  const orderFetcher = useFetcher();
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const didSubmitOrderRef = useRef(false);
  const didCloseCouponModalRef = useRef(false);
  const didSubmitCouponRemoveRef = useRef(false);

  const { customer, shippingAddress } = activeOrder ?? {};
  const isSignedIn = !!activeCustomer?.id;
  const addresses = activeCustomer?.addresses ?? [];
  const defaultFullName =
    shippingAddress?.fullName ??
    (customer ? `${customer.firstName} ${customer.lastName}` : '');
  const canProceedToPayment =
    customer &&
    ((shippingAddress?.streetLine1 && shippingAddress?.postalCode) ||
      selectedAddressIndex != null) &&
    activeOrder?.shippingLines?.length &&
    activeOrder?.lines?.length;

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
      console.log('Submitting customer form:', formData);
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
      console.log('Submitting address form:', formData);
      setAddressFormChanged(false);
    }
  }

  const submitSelectedShippingMethod = (value?: string) => {
    if (value) {
      const formData = new FormData();
      formData.append('action', 'setShippingMethod');
      formData.append('shippingMethodId', value);
      didSubmitOrderRef.current = true;
      orderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
    }
  };

  const handleOpenCouponModal = () => {
    setIsCouponModalOpen(true);
  };

  const appliedCouponCode = activeOrder?.couponCodes?.[0];
  const appliedCouponDetails = appliedCouponCode
    ? couponCodes.find((c: any) => c.couponCode === appliedCouponCode)
    : null;

  const allLines = activeOrder?.lines ?? [];
  const visibleLines = showAllCartItems ? allLines : allLines.slice(0, 3);

  // Revalidate only after a submit we initiated has completed
  useEffect(() => {
    if (orderFetcher.state === 'idle' && didSubmitOrderRef.current) {
      didSubmitOrderRef.current = false;
      revalidator.revalidate();
    }
  }, [orderFetcher.state, revalidator]);

  // Revalidate after coupon removal submit completes
  useEffect(() => {
    if (couponFetcher.state === 'idle' && didSubmitCouponRemoveRef.current) {
      didSubmitCouponRemoveRef.current = false;
      revalidator.revalidate();
    }
  }, [couponFetcher.state, revalidator]);

  return (
    <div>
      <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div>
            <div>
              <h2 className="text-lg font-medium text-black">Details Title</h2>
            </div>
            <Form
              method="post"
              action="/api/active-order"
              onBlur={submitAddressForm}
              onChange={() => setAddressFormChanged(true)}
            >
              <input type="hidden" name="action" value="setCheckoutShipping" />
              <div className="mt-10"></div>
              {isSignedIn && activeCustomer.addresses?.length ? (
                <div className="mt-4 bg-white border rounded-lg shadow-sm p-4">
                  {(() => {
                    const defaultShippingAddress =
                      activeCustomer.addresses.find(
                        (addr: AddressType) => addr.defaultShippingAddress,
                      );
                    const addressToShow =
                      defaultShippingAddress || activeCustomer.addresses[0];
                    return (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-sm font-medium text-black">
                            {defaultShippingAddress
                              ? 'Default Shipping Address'
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
                    <div className="mt-6 pt-6 border-t border-black">
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
              <OrderInstructions
                orderId={activeOrder.id}
                initialValue={orderInstructions}
                disabled={false}
              />
            )}
            <div className="mt-10 border-t border-black pt-10">
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
            {eligibleShippingMethods.length === 0 && (
              <div className="mt-10 border-t border-black pt-10">
                <p className="text-sm text-red-800">
                  No shipping methods available. Please contact support.
                </p>
              </div>
            )}
          </div>
          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-black mb-6">Summary</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
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
                adjustOrderLine={(lineId, quantity) => {
                  const fd = new FormData();
                  fd.append('action', 'adjustItem');
                  fd.append('lineId', lineId);
                  fd.append('quantity', String(quantity));
                  orderFetcher.submit(fd, {
                    method: 'post',
                    action: '/api/active-order',
                  });
                }}
                removeItem={(lineId) => {
                  const fd = new FormData();
                  fd.append('action', 'removeItem');
                  fd.append('lineId', lineId);
                  orderFetcher.submit(fd, {
                    method: 'post',
                    action: '/api/active-order',
                  });
                }}
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
                        onClick={() => {
                          didSubmitCouponRemoveRef.current = true;
                        }}
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
                    className="w-full bg-black text-white font-medium py-2 px-4 hover:text-black rounded-md border hover:border-black hover:bg-white transition-colors duration-200"
                  >
                    Apply Coupon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => {
          setIsCouponModalOpen(false);
          // Revalidate once after successful apply in modal
          didCloseCouponModalRef.current = true;
          revalidator.revalidate();
        }}
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
      <button
        type="button"
        disabled={!canProceedToPayment}
        onClick={onNext}
        className={classNames(
          canProceedToPayment
            ? 'bg-primary-600 hover:bg-primary-700'
            : 'bg-gray-400',
          'flex w-full items-center justify-center space-x-2 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        )}
      >
        <span>{t('checkout.goToPayment')}</span>
      </button>
    </div>
  );
}
