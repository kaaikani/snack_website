// app/routes/login.google.tsx
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { authenticate } from '~/providers/account/account';
import { getSessionStorage } from '~/sessions';

// ✅ IMPORTANT: Use the EXACT same token as in graphqlWrapper.ts
const CHANNEL_TOKEN = 'ind-snacks';

// Type guard functions
function isCurrentUser(
  result: any,
): result is { id: string; identifier: string; __typename?: 'CurrentUser' } {
  return (
    result &&
    typeof result.id === 'string' &&
    typeof result.identifier === 'string'
  );
}

function isInvalidCredentialsError(
  result: any,
): result is { message: string; __typename: 'InvalidCredentialsError' } {
  return result && result.__typename === 'InvalidCredentialsError';
}

function isNotVerifiedError(
  result: any,
): result is { message: string; __typename: 'NotVerifiedError' } {
  return result && result.__typename === 'NotVerifiedError';
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const token = formData.get('token')?.toString();

    if (!token) {
      console.error('No token provided');
      return json({ error: 'No token provided' }, { status: 400 });
    }

    console.log(
      'Received token (first 50 chars):',
      token.substring(0, 50) + '...',
    );

    // Decode the JWT to see the payload (for debugging)
    let userEmail: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email;
      console.log('Token payload:', {
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat,
        sub: payload.sub,
        email: payload.email,
      });
    } catch (e) {
      console.error('Failed to decode token:', e);
    }

    console.log('Attempting Google authentication...');

    // Get session storage
    const sessionStorage = await getSessionStorage();
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );

    // ✅ Use the FIXED channel token that matches graphqlWrapper.ts
    const channelToken = CHANNEL_TOKEN;
    console.log('Using channel token:', channelToken);

    // Use the same authenticate function as phone OTP, but with Google auth data
    const result = await authenticate(
      {
        google: {
          token: token,
        },
      },
      {
        request,
        customHeaders: { 'vendure-token': channelToken },
      },
    );

    console.log('Auth result:', result.result);

    // Handle the response exactly like phone OTP
    if (
      '__typename' in result.result &&
      result.result.__typename === 'CurrentUser'
    ) {
      const vendureToken = result.headers.get('vendure-auth-token');

      if (vendureToken) {
        console.log(
          'Authentication successful for user:',
          result.result.identifier,
        );

        // ✅ Save both authToken and channelToken
        session.set('authToken', vendureToken);
        session.set('channelToken', channelToken);
        session.set('userId', result.result.id);
        session.set('identifier', result.result.identifier);
        session.set('rememberMe', true);

        const cookieHeaders = await sessionStorage.commitSession(session);

        // ✅ Redirect to home with success parameters
        const url = new URL('/', request.url);
        const protocol =
          request.headers.get('X-Forwarded-Proto') || url.protocol;
        url.protocol = protocol + ':';
        url.searchParams.set('reload', 'true');
        url.searchParams.set('loginSuccess', 'true');

        return redirect(url.toString(), {
          headers: {
            'Set-Cookie': cookieHeaders,
          },
        });
      }
    }

    // Handle error cases
    if (isInvalidCredentialsError(result.result)) {
      console.error('Invalid credentials:', result.result.message);
      return json({ error: result.result.message }, { status: 401 });
    }

    if (isNotVerifiedError(result.result)) {
      console.error('Email not verified:', result.result.message);
      return json({ error: result.result.message }, { status: 401 });
    }

    // If we get here, authentication failed
    console.error('Unexpected authentication result:', result.result);
    console.error('Full auth result:', JSON.stringify(result.result, null, 2));
    return json({ error: 'Authentication failed' }, { status: 401 });
  } catch (error) {
    console.error('Google authentication error:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
