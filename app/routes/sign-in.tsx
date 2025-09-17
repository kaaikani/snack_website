'use client';

import { Link, useFetcher, useLocation } from '@remix-run/react';
import {
  type ActionFunctionArgs,
  json,
  redirect,
} from '@remix-run/server-runtime';
import { Button } from '~/components/Button';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  getChannelsByCustomerPhonenumber,
  resendPhoneOtp,
  sendPhoneOtp,
} from '~/providers/customPlugins/customPlugin';
import { authenticate } from '~/providers/account/account';
import { getSessionStorage } from '~/sessions';
import ToastNotification from '~/components/ToastNotification';
import { type LoaderFunctionArgs } from '@remix-run/node';
import { getActiveCustomer } from '~/providers/customer/customer';

// ✅ Hook to detect client (needed for disabling button before hydration)
function useIsClient() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const activeCustomer = await getActiveCustomer({ request });

  if (activeCustomer.activeCustomer?.id) {
    // If logged in, redirect to /home
    return redirect('/home');
  }

  // Else, allow the landing page to load
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const phoneNumber = body.get('phoneNumber') as string;
  const otp = body.get('otp') as string;
  const actionType = body.get('actionType') as string;
  const rememberMe = !!body.get('rememberMe');
  const redirectTo = (body.get('redirectTo') || '/') as string;

  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );

  if (!phoneNumber || phoneNumber.length !== 10) {
    return json(
      { message: 'Invalid phone number', success: false },
      { status: 400 },
    );
  }

  console.log('Incoming actionType:', actionType);
  console.log('Phone Number:', phoneNumber);

  // ✅ Send OTP flow
  if (actionType === 'send-otp') {
    try {
      // First check if the user exists by trying to get their channel
      try {
        const channels = await getChannelsByCustomerPhonenumber(phoneNumber);

        // If we get here, the user exists, so we can send the OTP
        if (channels && channels.length > 0) {
          const sent = await sendPhoneOtp(phoneNumber);
          console.log('sendPhoneOtp returned:', sent);
          return json({
            sent,
            success: true,
            message: 'OTP sent successfully',
          });
        } else {
          // No channels found for this user
          return json(
            {
              success: false,
              userNotRegistered: true,
              message:
                'This phone number is not registered. Please sign up first.',
            },
            { status: 404 },
          );
        }
      } catch (error) {
        console.error('Error checking user:', error);
        // Check if the error is about customer not found
        if (
          error instanceof Error &&
          error.message.includes('Customer not found')
        ) {
          return json(
            {
              success: false,
              userNotRegistered: true,
              message:
                'This phone number is not registered. Please sign up first.',
            },
            { status: 404 },
          );
        }

        // Some other error occurred
        throw error;
      }
    } catch (error) {
      console.error('Error in send-otp flow:', error);
      return json(
        {
          success: false,
          message:
            'An error occurred while processing your request. Please try again.',
        },
        { status: 500 },
      );
    }
  }

  // ✅ Resend OTP flow (same logic as send OTP, reusing sendPhoneOtp function)
  if (actionType === 'resend-otp') {
    try {
      const sent = await resendPhoneOtp(phoneNumber);
      console.log('resendPhoneOtp returned:', sent);
      return json({ sent, success: true, message: 'OTP resent successfully' });
    } catch (error) {
      console.error('Error in resend-otp flow:', error);
      return json(
        {
          success: false,
          message: 'Failed to resend OTP. Please try again.',
        },
        { status: 500 },
      );
    }
  }

  // ✅ Login flow
  if (actionType === 'login' && otp) {
    try {
      const channels = await getChannelsByCustomerPhonenumber(phoneNumber);

      console.log('Entered OTP:', otp);

      if (!channels || channels.length === 0) {
        return json(
          {
            message: 'No channel associated with this phone number.',
            success: false,
            userNotRegistered: true,
          },
          { status: 403 },
        );
      }

      const selectedChannelToken = channels[0].token;
      console.log('Using channel token:', selectedChannelToken);

      const result = await authenticate(
        {
          phoneOtp: {
            phoneNumber,
            code: otp,
          },
        },
        {
          request,
          customHeaders: { 'vendure-token': selectedChannelToken }, // ✅ Pass for authentication
        },
      );

      if (
        '__typename' in result.result &&
        result.result.__typename === 'CurrentUser'
      ) {
        const vendureToken = result.headers.get('vendure-auth-token');

        if (vendureToken) {
          // ✅ Save both authToken and channelToken
          session.set('authToken', vendureToken);
          session.set('channelToken', selectedChannelToken);
          session.set('rememberMe', rememberMe);

          const cookieHeaders = await sessionStorage.commitSession(session);

          // ✅ Redirect to home/account + force reload with success message
          const url = new URL(redirectTo, request.url);
          url.searchParams.set('reload', 'true');
          url.searchParams.set('loginSuccess', 'true');

          return redirect(url.toString(), {
            headers: {
              'Set-Cookie': cookieHeaders,
            },
          });
        }
      }

      console.log('Auth result:', result.result);
      console.log(
        'vendure-auth-token:',
        result.headers.get('vendure-auth-token'),
      );

      return json({ message: 'Invalid OTP', success: false }, { status: 401 });
    } catch (error) {
      console.error('Error in login flow:', error);
      return json(
        {
          success: false,
          message: 'An error occurred during login. Please try again.',
        },
        { status: 500 },
      );
    }
  }

  return json({ message: 'Invalid request', success: false }, { status: 400 });
}

export default function SignInPage() {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const isClient = useIsClient();
  const location = useLocation();

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const sendOtpFetcher = useFetcher();
  const loginFetcher = useFetcher();
  const resendOtpFetcher = useFetcher();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Function to show toast notification
  const showNotification = (
    type: 'success' | 'error',
    title: string,
    message: string,
  ) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setShowToast(true);
  };

  // Close toast notification
  const closeToast = () => {
    setShowToast(false);
  };

  // Check for URL parameters on load (for login success)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('loginSuccess') === 'true') {
      showNotification(
        'success',
        'Login Successful',
        'You have been successfully logged in.',
      );
    }
  }, [location]);

  // Handle OTP send response
  useEffect(() => {
    if (sendOtpFetcher.data) {
      const data = sendOtpFetcher.data as {
        sent?: boolean;
        success?: boolean;
        message?: string;
        userNotRegistered?: boolean;
      };

      if (data.sent) {
        setOtpSent(true);
        showNotification(
          'success',
          'OTP Sent',
          data.message || 'OTP has been sent to your phone.',
        );
      } else if (data.userNotRegistered) {
        // Handle unregistered user case
        showNotification(
          'error',
          'Not Registered',
          data.message ||
            'This phone number is not registered. Please sign up first.',
        );
      } else if (data.success === false) {
        showNotification(
          'error',
          'Error',
          data.message || 'Failed to send OTP.',
        );
      }
    }
  }, [sendOtpFetcher.data]);

  // Handle login response
  useEffect(() => {
    if (loginFetcher.data) {
      const data = loginFetcher.data as {
        success?: boolean;
        message?: string;
        userNotRegistered?: boolean;
      };

      if (data.userNotRegistered) {
        // Handle unregistered user case
        showNotification(
          'error',
          'Not Registered',
          data.message ||
            'This phone number is not registered. Please sign up first.',
        );
        // Reset OTP sent state to go back to phone number input
        setOtpSent(false);
      } else if (data.success === false) {
        showNotification(
          'error',
          'Login Failed',
          data.message || 'Invalid OTP. Please try again.',
        );
      }
    }
  }, [loginFetcher.data]);

  // Handle resend OTP response
  useEffect(() => {
    if (resendOtpFetcher.data) {
      const data = resendOtpFetcher.data as {
        sent?: boolean;
        success?: boolean;
        message?: string;
        userNotRegistered?: boolean;
      };

      if (data.sent) {
        showNotification(
          'success',
          'OTP Resent',
          data.message || 'OTP has been resent to your phone.',
        );
      } else if (data.userNotRegistered) {
        // Handle unregistered user case
        showNotification(
          'error',
          'Not Registered',
          data.message ||
            'This phone number is not registered. Please sign up first.',
        );
        // Reset OTP sent state to go back to phone number input
        setOtpSent(false);
      } else if (data.success === false) {
        showNotification(
          'error',
          'Error',
          data.message || 'Failed to resend OTP.',
        );
      }
    }
  }, [resendOtpFetcher.data]);

  return (
    <div className="sm:min-h-screen flex flex-col lg:grid lg:grid-cols-3 rounded-xl">
      {/* Toast Notification - Positioned at the top right */}
      <div className="fixed m-5 top-0 right-0 w-full max-w-sm z-50">
        <ToastNotification
          show={showToast}
          type={toastType}
          title={toastTitle}
          message={toastMessage}
          onClose={closeToast}
        />
      </div>

      {/* Mobile Top Image */}
      <div
        className="absolute inset-0 bg-cover bg-center lg:hidden"
        style={{
          backgroundImage: `url('https://www.beckydorner.com/wp-content/uploads/2021/09/Fruits-and-vegetables.jpg')`,
        }}
      />

      {/* Left Panel or Full Form on Mobile */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-xl p-6 sm:p-8">
        <div className="mt-8 space-y-6 max-w-sm mx-auto">
          <h2 className="text-5xl font-bold pt-10 text-gray-900 ">Sign In</h2>

          {!otpSent ? (
            <sendOtpFetcher.Form
              method="post"
              className="space-y-6"
              onSubmit={() => setHasSubmitted(true)}
            >
              <input type="hidden" name="actionType" value="send-otp" />
              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, ''); // Keep only digits
                    setPhoneNumber(cleaned.slice(0, 10)); // Max 10 digits
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {phoneNumber && phoneNumber.length !== 10 && (
                  <p className="text-sm text-red-600">
                    Please enter a valid 10-digit phone number.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  !isClient ||
                  phoneNumber.length !== 10 ||
                  sendOtpFetcher.state !== 'idle'
                }
                className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-600 disabled:hover:bg-gray-400 disabled:text-white disabled:hover:text-black disabled:cursor-not-allowed"
              >
                {sendOtpFetcher.state !== 'idle' ? 'Sending...' : 'Send OTP'}
              </Button>

              <p className="mt-10 text-center text-sm text-gray-500">
                Not a member?{' '}
                <Link
                  to="/sign-up"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Sign Up
                </Link>
              </p>
            </sendOtpFetcher.Form>
          ) : (
            <loginFetcher.Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="login" />
              <input type="hidden" name="phoneNumber" value={phoneNumber} />

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  OTP is Sent to Your Registered Phone Number
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  placeholder="Enter OTP"
                  className="w-full px-3 py-2 mt-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-gray-900"
                >
                  Remember Me
                </label>
              </div>

              <Button
                type="submit"
                disabled={loginFetcher.state !== 'idle'}
                className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                {loginFetcher.state !== 'idle' ? 'Signing In...' : 'Sign In'}
              </Button>

              <p className="mt-10 text-center text-gray-500">
                Didn't get OTP?{' '}
                <button
                  type="button"
                  onClick={() =>
                    resendOtpFetcher.submit(
                      { phoneNumber, actionType: 'resend-otp' },
                      { method: 'post' },
                    )
                  }
                  disabled={resendOtpFetcher.state !== 'idle'}
                  className="font-semibold text-md text-indigo-600 hover:text-indigo-500"
                >
                  {resendOtpFetcher.state !== 'idle'
                    ? 'Resending...'
                    : 'Resend OTP'}
                </button>
              </p>
            </loginFetcher.Form>
          )}
        </div>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:col-span-1 flex-col justify-center rounded-r-3xl shadow-xl px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="text-5xl font-bold text-gray-900">Sign In</h2>
          <div className="mt-8 space-y-6">
            {!otpSent ? (
              <sendOtpFetcher.Form
                method="post"
                className="space-y-6"
                onSubmit={() => setHasSubmitted(true)}
              >
                <input type="hidden" name="actionType" value="send-otp" />
                <div className="space-y-2">
                  <label
                    htmlFor="phoneNumber-desktop"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber-desktop"
                    name="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(cleaned.slice(0, 10));
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {hasSubmitted && phoneNumber.length !== 10 && (
                    <p className="text-sm text-red-600">
                      {phoneNumber.length === 0
                        ? 'Please enter your phone number.'
                        : 'Please enter a valid 10-digit phone number.'}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    !isClient ||
                    phoneNumber.length !== 10 ||
                    sendOtpFetcher.state !== 'idle'
                  }
                  className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-600 disabled:hover:bg-gray-400 disabled:text-white disabled:hover:text-black disabled:cursor-not-allowed"
                >
                  {sendOtpFetcher.state !== 'idle' ? 'Sending...' : 'Send OTP'}
                </Button>

                <p className="mt-10 text-center text-gray-500">
                  Not a member?{' '}
                  <Link
                    to="/sign-up"
                    className="font-semibold text-md text-indigo-600 hover:text-indigo-500"
                  >
                    Sign Up
                  </Link>
                </p>
              </sendOtpFetcher.Form>
            ) : (
              <loginFetcher.Form method="post" className="space-y-6">
                <input type="hidden" name="actionType" value="login" />
                <input type="hidden" name="phoneNumber" value={phoneNumber} />

                <div>
                  <label
                    htmlFor="otp-desktop"
                    className="block text-sm font-medium text-gray-700"
                  >
                    OTP is Sent to Your Registered Phone Number
                  </label>
                  <input
                    id="otp-desktop"
                    name="otp"
                    type="text"
                    required
                    placeholder="Enter OTP"
                    className="w-full px-3 py-2 mt-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="rememberMe-desktop"
                    name="rememberMe"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="rememberMe-desktop"
                    className="ml-2 text-sm text-gray-900"
                  >
                    Remember Me
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loginFetcher.state !== 'idle'}
                  className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600"
                >
                  {loginFetcher.state !== 'idle' ? 'Signing In...' : 'Sign In'}
                </Button>

                <p className="mt-10 text-center text-gray-500">
                  Didn't get OTP?{' '}
                  <button
                    type="button"
                    onClick={() =>
                      resendOtpFetcher.submit(
                        { phoneNumber, actionType: 'resend-otp' },
                        { method: 'post' },
                      )
                    }
                    disabled={resendOtpFetcher.state !== 'idle'}
                    className="font-semibold text-md text-indigo-600 hover:text-indigo-500"
                  >
                    {resendOtpFetcher.state !== 'idle'
                      ? 'Resending...'
                      : 'Resend OTP'}
                  </button>
                </p>
              </loginFetcher.Form>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel for Desktop */}
      <div className="hidden lg:flex lg:col-span-2 items-center justify-center relative p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{
            backgroundImage: `url('https://www.beckydorner.com/wp-content/uploads/2021/09/Fruits-and-vegetables.jpg')`,
          }}
        />
        <div className="relative z-10 text-center max-w-4xl p-8">
          <img
            src="/banner.jpg"
            alt="Product"
            className="mx-auto w-full rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
