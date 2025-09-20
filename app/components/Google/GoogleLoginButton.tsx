// app/components/GoogleLoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import { useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';

export function GoogleLoginButton() {
  const fetcher = useFetcher();

  const [buttonSize, setButtonSize] = useState<'small' | 'medium'>('medium');
  const [buttonText, setButtonText] = useState<'signin' | 'signin_with'>(
    'signin_with',
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Assuming 768px as the breakpoint for mobile
        setButtonSize('small');
        setButtonText('signin');
      } else {
        setButtonSize('medium');
        setButtonText('signin_with');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount to set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        size={buttonSize}
        text={buttonText}
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
