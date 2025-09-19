import { DocumentNode, print } from 'graphql';
import { API_URL } from './constants';
import { getSdk } from './generated/graphql';
import { getSessionStorage } from '~/sessions';

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

// Fixed channel token
const CHANNEL_TOKEN = 'ind-madurai';

async function sendQuery<Response, Variables = {}>(options: {
  query: string;
  variables?: Variables;
  headers?: Headers;
  request?: Request;
  customHeaders?: Record<string, string>;
}): Promise<GraphqlResponse<Response> & { headers: Headers }> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Always attach your fixed channel token
  headers.set('vendure-token', CHANNEL_TOKEN);

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
