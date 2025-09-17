'use client';

import { useFetcher } from '@remix-run/react';
import { CartLoaderData } from '~/routes/api.active-order';
import { useEffect, useCallback, useRef } from 'react';

export function useActiveOrder() {
  const activeOrderFetcher = useFetcher<CartLoaderData>();
  const hasFetched = useRef(false); // Track if initial fetch has occurred

  useEffect(() => {
    if (
      activeOrderFetcher.state === 'idle' &&
      !activeOrderFetcher.data &&
      !hasFetched.current
    ) {
      hasFetched.current = true;
      activeOrderFetcher.load('/api/active-order');
    }
  }, [activeOrderFetcher]);

  const refresh = useCallback(() => {
    if (activeOrderFetcher.state === 'idle') {
      activeOrderFetcher.load('/api/active-order');
    }
  }, [activeOrderFetcher]);

  const { activeOrder } = activeOrderFetcher.data ?? {};

  const removeItem = useCallback(
    (lineId: string) => {
      const formData = new FormData();
      formData.append('action', 'removeItem');
      formData.append('lineId', lineId);

      activeOrderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
    },
    [activeOrderFetcher],
  );

  const adjustOrderLine = useCallback(
    (lineId: string, quantity: number) => {
      const formData = new FormData();
      formData.append('action', 'adjustItem');
      formData.append('lineId', lineId);
      formData.append('quantity', quantity.toString());

      activeOrderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
    },
    [activeOrderFetcher],
  );

  const addItemToOrder = useCallback(
    (variantId: string, quantity: number = 1) => {
      const formData = new FormData();
      formData.append('action', 'addItemToOrder');
      formData.append('variantId', variantId);
      formData.append('quantity', quantity.toString());

      activeOrderFetcher.submit(formData, {
        method: 'post',
        action: '/api/active-order',
      });
    },
    [activeOrderFetcher],
  );

  return {
    activeOrderFetcher,
    activeOrder,
    removeItem,
    adjustOrderLine,
    addItemToOrder,
    refresh,
    isLoading:
      activeOrderFetcher.state === 'loading' ||
      activeOrderFetcher.state === 'submitting',
  };
}
