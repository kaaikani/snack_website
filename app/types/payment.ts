import type {
  AddPaymentToOrderResult,
  Order,
  Payment,
  IneligiblePaymentMethodError,
  NoActiveOrderError,
  OrderPaymentStateError,
  OrderStateTransitionError,
  PaymentDeclinedError,
  PaymentFailedError,
} from '~/generated/graphql';

/**
 * Payment information returned from addPaymentToOrder mutation
 */
export interface PaymentInfo {
  id: string;
  amount: number;
  state: string;
  transactionId?: string | null;
}

/**
 * Successful payment response with order details
 */
export interface PaymentOrderResponse {
  id: string;
  code: string;
  state: string;
  totalWithTax: number;
  payments: PaymentInfo[];
}

/**
 * Payment error response types
 */
export type PaymentError =
  | IneligiblePaymentMethodError
  | NoActiveOrderError
  | OrderPaymentStateError
  | OrderStateTransitionError
  | PaymentDeclinedError
  | PaymentFailedError;

/**
 * Result of addPaymentToOrder mutation
 * Can be either a successful order response or an error
 */
export type AddPaymentToOrderResponse =
  | { success: true; order: PaymentOrderResponse }
  | { success: false; error: PaymentError };

/**
 * Type guard to check if the result is a successful payment
 */
export function isPaymentSuccess(
  result: AddPaymentToOrderResult | any,
): result is Order {
  return result?.__typename === 'Order';
}

/**
 * Type guard to check if the result is a payment error
 */
export function isPaymentError(
  result: AddPaymentToOrderResult | any,
): result is PaymentError {
  const typename = result?.__typename;
  return (
    typename === 'IneligiblePaymentMethodError' ||
    typename === 'NoActiveOrderError' ||
    typename === 'OrderPaymentStateError' ||
    typename === 'OrderStateTransitionError' ||
    typename === 'PaymentDeclinedError' ||
    typename === 'PaymentFailedError'
  );
}
