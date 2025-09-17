import { json } from '@remix-run/node';
import { toggleFavorite } from '~/providers/customPlugins/customPlugin';
import { getActiveCustomer } from '~/providers/customer/customer';
import type { DataFunctionArgs } from '@remix-run/server-runtime';

interface ToggleFavoriteBody {
  productId: string;
}

export async function action({ request }: DataFunctionArgs) {
  const body = (await request.json()) as ToggleFavoriteBody;

  if (!body.productId || typeof body.productId !== 'string') {
    return json({ error: 'Invalid productId' }, { status: 400 });
  }

  const customer = await getActiveCustomer({ request });

  if (!customer?.activeCustomer?.id) {
    return json({ error: 'Not signed in' }, { status: 401 });
  }

  try {
    const result = await toggleFavorite(body.productId, { request });
    return json(result);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
