// app/components/Google/GoogleLoginButton.tsx

import { GoogleLogin } from '@react-oauth/google';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';
import { trackButtonClick } from '~/utils/facebook-pixel';

export function GoogleLoginButton() {
  const fetcher = useFetcher();

  // This effect can show alerts or toasts based on the backend response
  useEffect(() => {
    const data = fetcher.data as { error?: string };
    if (data?.error) {
      alert(`Login failed: ${data.error}`);
    }
  }, [fetcher.data]);

  return (
    <div className="relative">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          // Track button click
          trackButtonClick('Google Sign In Button');

          const token = credentialResponse.credential; // This is the correct ID Token (JWT)
          if (token) {
            fetcher.submit(
              { token }, // Sending the field named "token"
              {
                method: 'post',
                action: '/login/google',
              },
            );
          }
        }}
        onError={() => {
          console.error('Google login failed');
        }}
        theme="outline"
        size="medium"
        text="signin"
        shape="rectangular"
      />

      {/* Loading overlay */}
      {fetcher.state === 'submitting' && (
        <div className="absolute inset-0 bg-white/80 rounded flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Signing in...</span>
          </div>
        </div>
      )}
    </div>
  );
}
