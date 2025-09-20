// app/components/GoogleLoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

export function GoogleLoginButton() {
  const fetcher = useFetcher();

  // Handle the response from the server
  useEffect(() => {
    const data = fetcher.data as { error?: string };
    if (data?.error) {
      console.error('Google login error:', data.error);
      alert(`Login failed: ${data.error}`);
    }
  }, [fetcher.data]);

  return (
    <div>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log('Google login success:', credentialResponse);
          const token = credentialResponse.credential;
          if (token) {
            fetcher.submit(
              { token },
              {
                method: 'post',
                action: '/login/google', // Changed from '/' to '/login/google'
              },
            );
          } else {
            console.error('No token received from Google');
            alert('No token received from Google');
          }
        }}
        onError={() => {
          console.error('Google login failed');
          alert('Google login failed');
        }}
        useOneTap={false}
        theme="outline"
        size="medium"
        text="signin_with"
        shape="rectangular"
        // width="100%"
      />
      {fetcher.state === 'submitting' && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Signing in...
        </div>
      )}
    </div>
  );
}
