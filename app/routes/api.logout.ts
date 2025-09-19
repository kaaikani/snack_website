import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { getSessionStorage } from '~/sessions';

export async function action({ request }: ActionFunctionArgs) {
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );

  const headers = new Headers();
  headers.append('Set-Cookie', await sessionStorage.destroySession(session));

  return redirect('/', { headers });
}
