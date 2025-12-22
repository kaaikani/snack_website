import { DocumentNode, print } from 'graphql';
import { API_URL } from './constants';
import { getSdk } from './generated/graphql';
import { getSessionStorage } from '~/sessions';
import { getStoredChannelToken } from './utils/country-currency';

export interface QueryOptions {
  request?: Request;
  headers?: Headers;
  customHeaders?: Record<string, string>;
}

export interface GraphqlResponse<Response> {
  errors: any[];
  data: Response;
}

export type WithHeaders<T> = T & { _headers: Headers };

// Get channel token from cookie (for server-side) or localStorage (for client-side)
function getChannelTokenFromCookie(request?: Request): string | null {
  if (!request) return null;
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['channel-token'] || null;
}

// Get channel token dynamically from localStorage, cookie, or default
function getChannelToken(request?: Request): string {
  if (typeof window !== 'undefined') {
    return getStoredChannelToken();
  }

  // Server-side: try to get from cookie
  if (request) {
    const cookieToken = getChannelTokenFromCookie(request);
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Default for server-side - India INR channel (Ind-Snacks)
  return 'Ind-Snacks';
}

async function sendQuery<Response, Variables = {}>(options: {
  query: string;
  variables?: Variables;
  headers?: Headers;
  request?: Request;
  customHeaders?: Record<string, string>;
}): Promise<GraphqlResponse<Response> & { headers: Headers }> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Get channel token dynamically (from localStorage on client, cookie on server, or default)
  const channelToken = getChannelToken(options.request);
  headers.set('vendure-token', channelToken);

  if (options.request) {
    const session = await getSessionStorage().then((s) =>
      s.getSession(options.request?.headers.get('Cookie')),
    );
    const authToken = session.get('authToken');
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
  }

  if (options.customHeaders) {
    for (const key in options.customHeaders) {
      headers.set(key, options.customHeaders[key]);
    }
  }

  return fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(options),
    headers,
  }).then(async (res) => ({
    ...(await res.json()),
    headers: res.headers,
  }));
}

function requester<R, V>(
  doc: DocumentNode,
  vars?: V,
  options?: { headers?: Headers; request?: Request },
): Promise<R & { _headers: Headers }> {
  return sendQuery<R, V>({
    query: print(doc),
    variables: vars,
    ...options,
  }).then(async (response) => {
    const headers: Record<string, string> = {};
    headers['x-vendure-api-url'] = API_URL;

    if (response.errors) {
      console.error(
        response.errors[0].extensions?.exception?.stacktrace.join('\n') ??
          response.errors,
      );
      throw new Error(JSON.stringify(response.errors[0]));
    }

    return { ...response.data, _headers: new Headers(headers) };
  });
}

const baseSdk = getSdk<QueryOptions, unknown>(requester);

type Sdk = typeof baseSdk;
type SdkWithHeaders = {
  [k in keyof Sdk]: (
    ...args: Parameters<Sdk[k]>
  ) => Promise<Awaited<ReturnType<Sdk[k]>> & { _headers: Headers }>;
};

export const sdk: SdkWithHeaders = baseSdk as any;
