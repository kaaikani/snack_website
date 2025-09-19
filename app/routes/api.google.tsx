// app/routes/login.google.tsx
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { authenticateWithGoogle } from '~/providers/customPlugins/customPlugin';
import { getSessionStorage } from '~/sessions';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const token = formData.get('token')?.toString();
    
    if (!token) {
      console.error('No token provided');
      return json({ error: 'No token provided' }, { status: 400 });
    }

    console.log('Attempting Google authentication...');
    const authResult = await authenticateWithGoogle(token, { request });
    
    console.log('Auth result:', authResult);
    const typename = authResult.__typename;

    if (typename === 'InvalidCredentialsError') {
      console.error('Invalid credentials:', authResult.message);
      return json({ error: authResult.message }, { status: 401 });
    }
    
    if (typename === 'NotVerifiedError') {
      console.error('Email not verified:', authResult.message);
      return json({ error: authResult.message }, { status: 401 });
    }

    if (typename === 'CurrentUser') {
      console.log('Authentication successful for user:', authResult.identifier);
      
      const sessionStorage = await getSessionStorage();
      const session = await sessionStorage.getSession(request.headers.get('Cookie'));
      
      session.set('userId', authResult.id);
      session.set('identifier', authResult.identifier);
      
      return redirect('/', {
        headers: {
          'Set-Cookie': await sessionStorage.commitSession(session),
        },
      });
    }

    // Handle other possible error types
    console.error('Unexpected authentication result:', typename);
    return json({ error: 'Authentication failed' }, { status: 401 });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}