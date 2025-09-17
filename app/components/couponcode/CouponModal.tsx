'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFetcher } from '@remix-run/react';
import ToastNotification from '../ToastNotification';
import { Clock, Users, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';

// Interfaces
interface Coupon {
  id: string;
  name: string;
  couponCode?: string | null;
  description: string;
  enabled: boolean;
  endsAt?: string | null;
  startsAt?: any;
  usageLimit?: number | null;
  updatedAt?: string;
  conditions: Array<{
    code: string;
    args: Array<{ name: string; value: string }>;
  }>;
}

interface Order {
  id: string;
  code: string;
  active: boolean;
  createdAt?: any;
  state: string;
  currencyCode: string;
  totalQuantity: number;
  subTotal: number;
  subTotalWithTax: number;
  total?: number;
  totalWithTax: number;
  couponCodes?: string[] | null;
  lines?: Array<{
    id: string;
    productVariant: { id: string; name?: string };
    quantity: number;
  }> | null;
  payments?: Array<{ id: string }> | null;
}

interface CouponFetcherData {
  success?: boolean;
  message?: string;
  error?: string;
  orderTotal?: number;
  appliedCoupon?: string | null;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  activeOrder: Order | null;
  appliedCoupon: string | null;
}

const formatErrorMessage = (errorMsg: string) => {
  const minimumAmountMatch = errorMsg.match(
    /Add ₹([\d.]+) more to apply this coupon/,
  );
  if (minimumAmountMatch) {
    return {
      title: 'Minimum Amount Required',
      message: `Add ₹${minimumAmountMatch[1]} more to unlock this coupon 🛒`,
    };
  }
  if (
    /(usage limit|limit reached|Coupon usage limit reached|exceed|exceeded)/i.test(
      errorMsg,
    )
  ) {
    return {
      title: 'Usage Limit Reached',
      message: 'This coupon is no longer available. Try another one! 🎫',
    };
  }
  if (/expired|expir/i.test(errorMsg)) {
    return {
      title: 'Coupon Expired',
      message: 'This coupon has expired. Check out our other offers! ⏰',
    };
  }
  if (/invalid|not found/i.test(errorMsg)) {
    return {
      title: 'Invalid Coupon',
      message: 'This coupon code is not valid. Please check and try again! ❌',
    };
  }
  return {
    title: 'Oops!',
    message: errorMsg || 'Something went wrong. Please try again.',
  };
};

const formatDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return 'Not available';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export function CouponModal({
  isOpen,
  onClose,
  coupons,
  activeOrder,
  appliedCoupon,
}: CouponModalProps) {
  const couponFetcher = useFetcher<CouponFetcherData>();
  const [errorState, setErrorState] = useState({
    show: false,
    title: '',
    message: '',
    key: 0,
  });
  const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(
    new Set(),
  );
  const [hasProcessedResponse, setHasProcessedResponse] = useState(false);
  const lastProcessedDataRef = useRef<string>('');

  const enabledCoupons = [...coupons]
    .filter((coupon) => coupon.enabled && coupon.couponCode)
    .sort((a, b) => {
      const aTime = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : Number.NEGATIVE_INFINITY;
      const bTime = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : Number.NEGATIVE_INFINITY;
      return bTime - aTime;
    });

  const isCouponApplied = !!activeOrder?.couponCodes?.length;

  useEffect(() => {
    if (!couponFetcher.data || hasProcessedResponse) return;

    const currentDataStr = JSON.stringify(couponFetcher.data);
    if (currentDataStr === lastProcessedDataRef.current) return;

    lastProcessedDataRef.current = currentDataStr;

    if (couponFetcher.data.error) {
      const { title, message } = formatErrorMessage(couponFetcher.data.error);
      setErrorState((prev) => ({
        show: true,
        title,
        message,
        key: prev.key + 1,
      }));
    } else if (couponFetcher.data.success) {
      onClose();
    }

    setHasProcessedResponse(true);
  }, [couponFetcher.data, hasProcessedResponse, onClose]);

  useEffect(() => {
    if (isOpen) {
      setErrorState((prev) => ({ ...prev, show: false }));
      setHasProcessedResponse(false);
      lastProcessedDataRef.current = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (couponFetcher.state === 'idle' && hasProcessedResponse) {
      const timer = setTimeout(() => setHasProcessedResponse(false), 100);
      return () => clearTimeout(timer);
    }
  }, [couponFetcher.state, hasProcessedResponse]);

  const closeErrorToast = useCallback(() => {
    setErrorState((prev) => ({ ...prev, show: false }));
  }, []);

  const toggleCouponExpansion = useCallback((couponId: string) => {
    setExpandedCoupons((prev) => {
      const newSet = new Set(prev);
      newSet.has(couponId) ? newSet.delete(couponId) : newSet.add(couponId);
      return newSet;
    });
  }, []);

  const getCouponIcon = (index: number) => {
    const icons = ['🎯', '💎', '🔥', '⚡', '🎁', '💰'];
    return icons[index % icons.length];
  };

  const getVariantNames = (coupon: Coupon): string[] => {
    const names: string[] = [];
    for (const condition of coupon.conditions) {
      if (condition.code === 'productVariantIds') {
        for (const arg of condition.args) {
          if (arg.name === 'productVariantIds') {
            try {
              const ids = JSON.parse(arg.value);
              const lines = activeOrder?.lines ?? [];
              const checkIds = Array.isArray(ids) ? ids : [ids];
              checkIds.forEach((id: string) => {
                const item = lines.find((l) => l.productVariant.id === id);
                if (item?.productVariant.name)
                  names.push(item.productVariant.name);
              });
            } catch {
              const item = activeOrder?.lines?.find(
                (line) => line.productVariant.id === arg.value,
              );
              if (item?.productVariant.name)
                names.push(item.productVariant.name);
            }
          }
        }
      }
    }
    return names;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-gray-900">Apply Coupons</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Coupon List */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            {enabledCoupons.length > 0 ? (
              <div className="space-y-4">
                {enabledCoupons.map((coupon, index) => {
                  const isApplied =
                    appliedCoupon === coupon.couponCode &&
                    activeOrder?.couponCodes?.includes(coupon.couponCode!);
                  const isExpanded = expandedCoupons.has(coupon.id);
                  const variantNames = getVariantNames(coupon);
                  const isSubmitting = couponFetcher.state === 'submitting';

                  return (
                    <div
                      key={coupon.id}
                      className={`relative border rounded-xl transition-all duration-200 ${
                        isApplied
                          ? 'border-green-400 bg-green-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold">
                              {getCouponIcon(index)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">
                                  {coupon.couponCode}
                                </span>
                                {isApplied && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Applied
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {coupon.name}
                              </p>
                            </div>
                          </div>
                          <couponFetcher.Form method="post">
                            <input
                              type="hidden"
                              name="action"
                              value="applyCoupon"
                            />
                            <input
                              type="hidden"
                              name="couponCode"
                              value={coupon.couponCode ?? ''}
                            />
                            <button
                              type="submit"
                              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                                isCouponApplied && !isApplied
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : isApplied
                                  ? 'bg-green-500 text-white'
                                  : 'bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg'
                              }`}
                              disabled={
                                typeof coupon.couponCode !== 'string' ||
                                (isCouponApplied && !isApplied) ||
                                isSubmitting
                              }
                            >
                              {isSubmitting
                                ? 'APPLYING...'
                                : isApplied
                                ? 'APPLIED'
                                : 'APPLY'}
                            </button>
                          </couponFetcher.Form>
                        </div>

                        {/* Description & toggle */}
                        <div className="mb-3">
                          <div
                            className="text-sm text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: isExpanded
                                ? coupon.description || 'No details available'
                                : (
                                    coupon.description || 'No details available'
                                  ).substring(0, 100) +
                                  (coupon.description?.length &&
                                  coupon.description.length > 100
                                    ? '...'
                                    : ''),
                            }}
                          />
                          {coupon.description?.length > 100 && (
                            <button
                              onClick={() => toggleCouponExpansion(coupon.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> LESS
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> MORE
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {(variantNames.length > 0 ||
                          coupon.endsAt ||
                          coupon.usageLimit) && (
                          <div className="space-y-2 pt-3 border-t border-gray-100">
                            {variantNames.length > 0 && (
                              <div className="text-xs text-gray-700">
                                <strong className="text-gray-500 mr-1">
                                  Products:
                                </strong>
                                {variantNames.join(', ')}
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500">
                              {coupon.endsAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Expires:{' '}
                                    {new Date(
                                      coupon.endsAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {coupon.usageLimit && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>Limit: {coupon.usageLimit} uses</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Tag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Coupons Available
                </h3>
                <p className="text-gray-500">
                  Check back later for exclusive offers and discounts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastNotification
        key={errorState.key}
        show={errorState.show}
        type="error"
        title={errorState.title}
        message={errorState.message}
        onClose={closeErrorToast}
        autoDismiss={true}
        dismissDuration={4000}
      />
    </>
  );
}

export default CouponModal;
