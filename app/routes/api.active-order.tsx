import {
  addItemToOrder,
  adjustOrderLine,
  getActiveOrder,
  removeOrderLine,
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderShippingMethod,
  getCouponCodeList,
  removeCouponCode,
  removeCouponProductFromCart,
} from '~/providers/orders/order';
import { DataFunctionArgs, json } from '@remix-run/server-runtime';
import {
  CreateAddressInput,
  CreateCustomerInput,
  ErrorCode,
  ErrorResult,
  OrderDetailFragment,
} from '~/generated/graphql';
import { getSessionStorage } from '~/sessions';
import { shippingFormDataIsValid } from '~/utils/validation';

export type CartLoaderData = Awaited<ReturnType<typeof loader>>;

export async function loader({ request }: DataFunctionArgs) {
  return {
    activeOrder: await getActiveOrder({ request }),
  };
}

export async function action({ request, params }: DataFunctionArgs) {
  const body = await request.formData();
  const formAction = body.get('action');
  let activeOrder: OrderDetailFragment | undefined = undefined;
  let error: ErrorResult = {
    errorCode: ErrorCode.NoActiveOrderError,
    message: '',
  };

  switch (formAction) {
    case 'setCheckoutShipping':
      if (shippingFormDataIsValid(body)) {
        const shippingFormData = Object.fromEntries<any>(
          body.entries(),
        ) as CreateAddressInput;
        const result = await setOrderShippingAddress(
          {
            city: shippingFormData.city,
            company: shippingFormData.company,
            countryCode: shippingFormData.countryCode,
            customFields: shippingFormData.customFields,
            fullName: shippingFormData.fullName,
            phoneNumber: shippingFormData.phoneNumber,
            postalCode: shippingFormData.postalCode,
            province: shippingFormData.province,
            streetLine1: shippingFormData.streetLine1,
            streetLine2: shippingFormData.streetLine2,
          },
          { request },
        );
        if (result.setOrderShippingAddress.__typename === 'Order') {
          activeOrder = result.setOrderShippingAddress;
        } else {
          error = result.setOrderShippingAddress;
        }
      }
      break;
    case 'setOrderCustomer': {
      const customerData = Object.fromEntries<any>(
        body.entries(),
      ) as CreateCustomerInput;
      const result = await setCustomerForOrder(
        {
          emailAddress: customerData.emailAddress,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
        },
        { request },
      );
      if (result.setCustomerForOrder.__typename === 'Order') {
        activeOrder = result.setCustomerForOrder;
      } else {
        error = result.setCustomerForOrder;
      }
      break;
    }
    case 'setShippingMethod': {
      const shippingMethodId = body.get('shippingMethodId');
      if (typeof shippingMethodId === 'string') {
        const result = await setOrderShippingMethod(shippingMethodId, {
          request,
        });
        if (result.setOrderShippingMethod.__typename === 'Order') {
          activeOrder = result.setOrderShippingMethod;
        } else {
          error = result.setOrderShippingMethod;
        }
      }
      break;
    }
    case 'removeItem': {
      const lineId = body.get('lineId');

      // Get current order to check if we're removing a coupon product
      const currentOrder = await getActiveOrder({ request });
      const line = currentOrder?.lines.find((l) => l.id === lineId);
      const appliedCouponCode = currentOrder?.couponCodes?.[0];

      // Check if the item being removed is a coupon product
      if (line && appliedCouponCode) {
        try {
          const couponList = await getCouponCodeList({ request });
          const coupon = couponList.find(
            (c) => c.couponCode === appliedCouponCode,
          );

          if (coupon) {
            const productVariantIds: string[] = [];
            for (const condition of coupon.conditions) {
              const variantArg = condition.args.find(
                (arg) => arg.name === 'productVariantIds',
              );
              if (variantArg && variantArg.value) {
                try {
                  let parsedIds: string[] | string = variantArg.value;
                  if (variantArg.value.startsWith('[')) {
                    parsedIds = JSON.parse(variantArg.value);
                  } else {
                    parsedIds = [variantArg.value];
                  }
                  if (Array.isArray(parsedIds)) {
                    productVariantIds.push(
                      ...parsedIds.map((id) => id.toString()),
                    );
                  } else if (typeof parsedIds === 'string') {
                    productVariantIds.push(parsedIds);
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

            const isCouponProduct = productVariantIds
              .map(String)
              .includes(String(line.productVariant.id));

            if (isCouponProduct) {
              // Remove the coupon first
              await removeCouponCode(appliedCouponCode, { request });
            }
          }
        } catch (error) {
          console.error('Error checking/removing coupon:', error);
          // Continue with item removal even if coupon removal fails
        }
      }

      // Remove the item
      const result = await removeOrderLine(lineId?.toString() ?? '', {
        request,
      });
      if (result.removeOrderLine.__typename === 'Order') {
        activeOrder = result.removeOrderLine;

        // After removing the item, check if only coupon items remain
        const updatedOrder = await getActiveOrder({ request });
        const appliedCouponCode = updatedOrder?.couponCodes?.[0];

        if (
          appliedCouponCode &&
          updatedOrder?.lines &&
          updatedOrder.lines.length > 0
        ) {
          try {
            const couponList = await getCouponCodeList({ request });
            const coupon = couponList.find(
              (c) => c.couponCode === appliedCouponCode,
            );

            if (coupon) {
              const productVariantIds: string[] = [];
              for (const condition of coupon.conditions) {
                const variantArg = condition.args.find(
                  (arg) => arg.name === 'productVariantIds',
                );
                if (variantArg && variantArg.value) {
                  try {
                    let parsedIds: string[] | string = variantArg.value;
                    if (variantArg.value.startsWith('[')) {
                      parsedIds = JSON.parse(variantArg.value);
                    } else {
                      parsedIds = [variantArg.value];
                    }
                    if (Array.isArray(parsedIds)) {
                      productVariantIds.push(
                        ...parsedIds.map((id) => id.toString()),
                      );
                    } else if (typeof parsedIds === 'string') {
                      productVariantIds.push(parsedIds);
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

              // Check if all remaining items are coupon items
              const allItemsAreCouponItems = updatedOrder.lines.every((line) =>
                productVariantIds.includes(line.productVariant.id),
              );

              // If all items are coupon items, remove the coupon
              if (allItemsAreCouponItems) {
                console.log(
                  'All remaining items are coupon items, removing coupon:',
                  appliedCouponCode,
                );
                try {
                  // Remove coupon products first
                  if (productVariantIds.length > 0) {
                    await removeCouponProductFromCart(appliedCouponCode, {
                      request,
                    });
                  }
                  // Remove the coupon code
                  await removeCouponCode(appliedCouponCode, { request });
                  console.log('Coupon removed successfully');

                  // Get the final updated order after coupon removal
                  const finalOrder = await getActiveOrder({ request });
                  activeOrder = finalOrder ? finalOrder : undefined;
                } catch (error) {
                  console.error('Failed to remove coupon:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error checking coupon items:', error);
          }
        }
      } else {
        error = result.removeOrderLine;
      }
      break;
    }
    case 'adjustItem': {
      const lineId = body.get('lineId');
      const quantity = body.get('quantity');
      if (lineId && quantity != null) {
        const result = await adjustOrderLine(lineId?.toString(), +quantity, {
          request,
        });
        if (result.adjustOrderLine.__typename === 'Order') {
          activeOrder = result.adjustOrderLine;

          // After adjusting the item, check if only coupon items remain or if order total is below minimum
          const updatedOrder = await getActiveOrder({ request });
          const appliedCouponCode = updatedOrder?.couponCodes?.[0];

          if (
            appliedCouponCode &&
            updatedOrder?.lines &&
            updatedOrder.lines.length > 0
          ) {
            try {
              const couponList = await getCouponCodeList({ request });
              const coupon = couponList.find(
                (c) => c.couponCode === appliedCouponCode,
              );

              if (coupon) {
                const productVariantIds: string[] = [];
                for (const condition of coupon.conditions) {
                  const variantArg = condition.args.find(
                    (arg) => arg.name === 'productVariantIds',
                  );
                  if (variantArg && variantArg.value) {
                    try {
                      let parsedIds: string[] | string = variantArg.value;
                      if (variantArg.value.startsWith('[')) {
                        parsedIds = JSON.parse(variantArg.value);
                      } else {
                        parsedIds = [variantArg.value];
                      }
                      if (Array.isArray(parsedIds)) {
                        productVariantIds.push(
                          ...parsedIds.map((id) => id.toString()),
                        );
                      } else if (typeof parsedIds === 'string') {
                        productVariantIds.push(parsedIds);
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

                // Check if all remaining items are coupon items
                const allItemsAreCouponItems = updatedOrder.lines.every(
                  (line) => productVariantIds.includes(line.productVariant.id),
                );

                // Check for minimum order amount condition
                const minAmountCondition = coupon.conditions.find(
                  (c: any) =>
                    c.code === 'minimum_order_amount' ||
                    c.code === 'minimumOrderAmount' ||
                    c.code === 'minimumAmount',
                );

                const totalWithTaxPaise = updatedOrder?.totalWithTax ?? 0;
                let shouldRemoveCoupon = allItemsAreCouponItems;

                if (minAmountCondition && !shouldRemoveCoupon) {
                  const amountArg =
                    minAmountCondition.args.find(
                      (a: any) => a.name === 'amount',
                    ) ?? minAmountCondition.args[0];
                  const minAmountPaise =
                    Number.parseInt(amountArg.value, 10) || 0;

                  if (totalWithTaxPaise < minAmountPaise) {
                    shouldRemoveCoupon = true;
                    console.log(
                      `Order total ${totalWithTaxPaise} is below minimum ${minAmountPaise}, removing coupon: ${appliedCouponCode}`,
                    );
                  }
                }

                // If all items are coupon items or order total is below minimum, remove the coupon
                if (shouldRemoveCoupon) {
                  console.log('Removing coupon:', appliedCouponCode);
                  try {
                    // Remove coupon products first
                    if (productVariantIds.length > 0) {
                      await removeCouponProductFromCart(appliedCouponCode, {
                        request,
                      });
                    }
                    // Remove the coupon code
                    await removeCouponCode(appliedCouponCode, { request });
                    console.log('Coupon removed successfully');

                    // Get the final updated order after coupon removal
                    const finalOrder = await getActiveOrder({ request });
                    activeOrder = finalOrder ? finalOrder : undefined;
                  } catch (error) {
                    console.error('Failed to remove coupon:', error);
                  }
                }
              }
            } catch (error) {
              console.error('Error checking coupon items:', error);
            }
          }
        } else {
          error = result.adjustOrderLine;
        }
      }
      break;
    }
    case 'addItemToOrder': {
      const variantId = body.get('variantId')?.toString();
      const quantity = Number(body.get('quantity')?.toString() ?? 1);
      if (!variantId || !(quantity > 0)) {
        throw new Error(
          `Invalid input: variantId ${variantId}, quantity ${quantity}`,
        );
      }
      const result = await addItemToOrder(variantId, quantity, {
        request,
      });
      if (result.addItemToOrder.__typename === 'Order') {
        activeOrder = result.addItemToOrder;
      } else {
        error = result.addItemToOrder;
      }
      break;
    }
    case 'addPaymentToOrder': {
      // Handle payment addition (not implemented in provided code)
    }
    default:
    // Don't do anything
  }

  let headers: ResponseInit['headers'] = {};
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request?.headers.get('Cookie'),
  );
  session.flash('activeOrderError', error);
  headers = {
    'Set-Cookie': await sessionStorage.commitSession(session),
  };
  // Get the final active order if none was set during the action
  const finalActiveOrder = activeOrder || (await getActiveOrder({ request }));

  return json(
    { activeOrder: finalActiveOrder || undefined },
    {
      headers,
    },
  );
}
