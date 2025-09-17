'use client';

import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useFetcher,
  useLocation,
} from '@remix-run/react';
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  redirect,
} from '@remix-run/server-runtime';
import { authenticate } from '~/providers/account/account';
import { useTranslation } from 'react-i18next';
import {
  getChannelList,
  getChannelsByCustomerPhonenumber,
  resendPhoneOtp,
  sendPhoneOtp,
} from '~/providers/customPlugins/customPlugin';
import { getSessionStorage } from '~/sessions';
import { useEffect, useState } from 'react';
import React from 'react';
import ToastNotification from '~/components/ToastNotification';
import { Button } from '~/components/Button';
import { getActiveCustomer } from '~/providers/customer/customer';

interface RegisterValidationErrors {
  form?: string;
  fieldErrors?: {
    phoneNumber?: string;
    otp?: string;
    emailAddress?: string;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const channels = await getChannelList({ request });
  const activeCustomer = await getActiveCustomer({ request });

  if (activeCustomer.activeCustomer?.id) {
    // If logged in, redirect to /home
    return redirect('/home');
  }
  return json({ channels });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const intent = body.get('intent')?.toString();
  const phoneNumber = body.get('phoneNumber')?.toString();
  const code = body.get('otp')?.toString();
  const selectedChannelToken = String(body.get('channel') || '');

  const redirectTo = (body.get('redirectTo') || '/account') as string;
  const firstName = body.get('firstName') as string;
  const lastName = body.get('lastName') as string;
  const emailAddress = body.get('emailAddress') as string;

  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );

  if (selectedChannelToken) {
    session.set('channelToken', selectedChannelToken);
  }

  if (intent === 'send-otp' && phoneNumber) {
    try {
      // Check if user already exists with this phone number
      try {
        const existingChannels = await getChannelsByCustomerPhonenumber(
          phoneNumber,
        );

        if (existingChannels && existingChannels.length > 0) {
          // User already exists, return error with channel info
          const channelName = existingChannels[0].code || 'this service';
          return json(
            {
              success: false,
              userAlreadyRegistered: true,
              channelName,
              message: `Sorry, you are already registered in ${channelName}. If you need to change, contact customer care.`,
            },
            {
              headers: {
                'Set-Cookie': await sessionStorage.commitSession(session),
              },
            },
          );
        }
      } catch (error) {
        // If we get "Customer not found" error, that's good - it means the user doesn't exist
        if (
          error instanceof Error &&
          error.message.includes('Customer not found')
        ) {
          // Proceed with registration
        } else {
          // Some other error occurred
          console.error('Error checking user existence:', error);
          throw error;
        }
      }

      // If we get here, the user doesn't exist, so we can send the OTP
      const sent = await sendPhoneOtp(phoneNumber);
      return json(
        sent
          ? { sent: true, success: true, message: 'OTP sent successfully' }
          : { success: false, message: 'Failed to send OTP' },
        {
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    } catch (error) {
      console.error('Error in send-otp flow:', error);
      return json(
        {
          success: false,
          message:
            'An error occurred while processing your request. Please try again.',
        },
        {
          status: 500,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    }
  }

  if (intent === 'resend-otp' && phoneNumber) {
    try {
      const sent = await resendPhoneOtp(phoneNumber);
      return json(
        sent
          ? { sent: true, success: true, message: 'OTP resent successfully' }
          : { success: false, message: 'Failed to resend OTP' },
        {
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    } catch (error) {
      console.error('Error in resend-otp flow:', error);
      return json(
        {
          success: false,
          message: 'Failed to resend OTP. Please try again.',
        },
        {
          status: 500,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    }
  }

  if (intent === 'submit-form') {
    if (!phoneNumber || !code) {
      return json(
        { success: false, message: 'Phone number and OTP are required' },
        {
          status: 400,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    }

    if (!selectedChannelToken) {
      return json(
        {
          success: false,
          message: 'No channel was selected. Please try again.',
        },
        {
          status: 400,
        },
      );
    }

    try {
      const { result, headers } = await authenticate(
        {
          phoneOtp: {
            phoneNumber,
            code,

            firstName,
            lastName,
          },
        },
        {
          request,
          customHeaders: {
            'vendure-token': selectedChannelToken,
          },
        },
      );

      const vendureToken = headers.get('vendure-auth-token');

      if ('__typename' in result && result.__typename === 'CurrentUser') {
        if (vendureToken) {
          session.set('authToken', vendureToken);
          session.set('channelToken', selectedChannelToken);
        }

        const cookieHeaders = await sessionStorage.commitSession(session);

        // Redirect to home/account + force reload with success message
        const url = new URL(redirectTo, request.url);
        url.searchParams.set('reload', 'true');
        url.searchParams.set('SignupSuccess', 'true');

        return redirect(url.toString(), {
          headers: {
            'Set-Cookie': cookieHeaders,
          },
        });
      } else {
        return json(
          { success: false, message: 'Invalid OTP' },
          {
            status: 401,
            headers: {
              'Set-Cookie': await sessionStorage.commitSession(session),
            },
          },
        );
      }
    } catch (error: any) {
      return json(
        { success: false, message: error.message || 'Unexpected error' },
        {
          status: 500,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        },
      );
    }
  }

  return json(
    { success: false, message: 'Invalid request' },
    {
      status: 400,
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    },
  );
}

// Hook to detect client (needed for disabling button before hydration)
function useIsClient() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

export default function SignUpPage() {
  const { t } = useTranslation();
  const { channels } = useLoaderData<typeof loader>();
  const formErrors = useActionData<RegisterValidationErrors>();
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const resendOtpFetcher = useFetcher();
  const [otpSent, setOtpSent] = useState(false);
  const sendOtpFetcher = useFetcher<{ otpSent?: boolean; form?: string }>();
  const signUpFetcher = useFetcher<{ success?: boolean; message?: string }>();
  const location = useLocation();
  const isClient = useIsClient();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

  // Check for URL parameters on load (for signup success)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('SignupSuccess') === 'true') {
      showNotification(
        'success',
        'Signup Successful',
        'You have been successfully registered and logged in.',
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
        userAlreadyRegistered?: boolean;
        channelName?: string;
      };

      if (data.userAlreadyRegistered) {
        // User is already registered, show error message
        showNotification(
          'error',
          'Already Registered',
          data.message ||
            `This phone number is already registered. Please sign in instead.`,
        );
      } else if (data.sent) {
        // OTP sent successfully
        setOtpSent(true);
        showNotification(
          'success',
          'OTP Sent',
          data.message || 'OTP has been sent to your phone.',
        );
      } else if (data.success === false) {
        // Other error
        showNotification(
          'error',
          'Error',
          data.message || 'Failed to send OTP.',
        );
      }
    }
  }, [sendOtpFetcher.data]);

  // Handle signup response
  useEffect(() => {
    if (signUpFetcher.data) {
      const data = signUpFetcher.data as {
        success?: boolean;
        message?: string;
      };
      if (data.success === false) {
        showNotification(
          'error',
          'Signup Failed',
          data.message || 'Invalid OTP. Please try again.',
        );
      }
    }
  }, [signUpFetcher.data]);

  // Handle resend OTP response
  useEffect(() => {
    if (resendOtpFetcher.data) {
      const data = resendOtpFetcher.data as {
        sent?: boolean;
        success?: boolean;
        message?: string;
      };
      if (data.sent) {
        showNotification(
          'success',
          'OTP Resent',
          data.message || 'OTP has been resent to your phone.',
        );
      } else if (data.success === false) {
        showNotification(
          'error',
          'Error',
          data.message || 'Failed to resend OTP.',
        );
      }
    }
  }, [resendOtpFetcher.data]);

  // Handle redirect if needed (for cases where the server doesn't redirect)
  useEffect(() => {
    if ((signUpFetcher.data as { success?: boolean })?.success === true) {
      // If we get a success response but no redirect happened,
      // we can manually redirect
      window.location.href = '/account?SignupSuccess=true';
    }
  }, [signUpFetcher.data]);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    emailAddress: '',
    channel: channels.length === 1 ? channels[0].token : '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'phoneNumber') {
      // Keep only digits and limit to 10 characters
      newValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };
  const SendOtpForm = sendOtpFetcher.Form;

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
          <h2 className="text-5xl font-bold pt-10 text-gray-900 ">Sign Up</h2>

          {!otpSent ? (
            <SendOtpForm
              method="post"
              className="space-y-6"
              onSubmit={() => setHasSubmitted(true)}
            >
              <input type="hidden" name="intent" value="send-otp" />
              <input
                type="hidden"
                name="emailAddress"
                value={formData.emailAddress}
              />

              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {hasSubmitted && formData.phoneNumber.length !== 10 && (
                  <p className="text-sm text-red-600">
                    {formData.phoneNumber.length === 0
                      ? 'Please enter your phone number.'
                      : 'Please enter a valid 10-digit phone number.'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {channels.length > 1 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Available City
                  </label>
                  <select
                    name="channel"
                    value={formData.channel}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select a city</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.token}>
                        {channel.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  !isClient ||
                  formData.phoneNumber.length !== 10 ||
                  sendOtpFetcher.state !== 'idle'
                }
                className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-600 disabled:hover:bg-gray-400 disabled:text-white disabled:hover:text-black disabled:cursor-not-allowed"
              >
                {sendOtpFetcher.state !== 'idle' ? 'Checking...' : 'Send OTP'}
              </Button>

              <p className="mt-10 text-center text-sm text-gray-500">
                Already a member?{' '}
                <Link
                  to="/sign-in"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Login to your existing account
                </Link>
              </p>
            </SendOtpForm>
          ) : (
            <signUpFetcher.Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="submit-form" />
              <input
                type="hidden"
                name="phoneNumber"
                value={formData.phoneNumber}
              />
              <input
                type="hidden"
                name="firstName"
                value={formData.firstName}
              />
              <input type="hidden" name="lastName" value={formData.lastName} />
              <input type="hidden" name="channel" value={formData.channel} />
              <input
                type="hidden"
                name="emailAddress"
                value={formData.emailAddress}
              />

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

              <Button
                type="submit"
                disabled={signUpFetcher.state !== 'idle'}
                className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                {signUpFetcher.state !== 'idle' ? 'Registering...' : 'Register'}
              </Button>

              <p className="mt-10 text-center text-gray-500">
                Didn't get OTP?{' '}
                <button
                  type="button"
                  onClick={() =>
                    resendOtpFetcher.submit(
                      {
                        phoneNumber: formData.phoneNumber,
                        intent: 'resend-otp',
                      },
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
            </signUpFetcher.Form>
          )}
        </div>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:col-span-1 flex-col justify-center rounded-r-3xl shadow-xl px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="text-5xl font-bold text-gray-900">Sign Up</h2>
          <div className="mt-8 space-y-6">
            {!otpSent ? (
              <SendOtpForm
                method="post"
                className="space-y-6"
                onSubmit={() => setHasSubmitted(true)}
              >
                <input type="hidden" name="intent" value="send-otp" />

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
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {hasSubmitted && formData.phoneNumber.length !== 10 && (
                    <p className="text-sm text-red-600">
                      {formData.phoneNumber.length === 0
                        ? 'Please enter your phone number.'
                        : 'Please enter a valid 10-digit phone number.'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                {channels.length > 1 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available City
                    </label>
                    <select
                      name="channel"
                      value={formData.channel}
                      onChange={handleChange}
                      required
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select a city</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.token}>
                          {channel.code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !isClient ||
                    formData.phoneNumber.length !== 10 ||
                    sendOtpFetcher.state !== 'idle'
                  }
                  className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-600 disabled:hover:bg-gray-400 disabled:text-white disabled:hover:text-black disabled:cursor-not-allowed"
                >
                  {sendOtpFetcher.state !== 'idle' ? 'Checking...' : 'Send OTP'}
                </Button>

                <p className="mt-10 text-center text-sm text-gray-500">
                  Already a member?{' '}
                  <Link
                    to="/sign-in"
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Login to your existing account
                  </Link>
                </p>
              </SendOtpForm>
            ) : (
              <signUpFetcher.Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="submit-form" />
                <input
                  type="hidden"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                />
                <input
                  type="hidden"
                  name="firstName"
                  value={formData.firstName}
                />
                <input
                  type="hidden"
                  name="lastName"
                  value={formData.lastName}
                />
                <input type="hidden" name="channel" value={formData.channel} />
                <input
                  type="hidden"
                  name="emailAddress"
                  value={formData.emailAddress}
                />

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

                <Button
                  type="submit"
                  disabled={signUpFetcher.state !== 'idle'}
                  className="w-full mt-2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                >
                  {signUpFetcher.state !== 'idle'
                    ? 'Registering...'
                    : 'Register'}
                </Button>

                <p className="mt-10 text-center text-gray-500">
                  Didn't get OTP?{' '}
                  <button
                    type="button"
                    onClick={() =>
                      resendOtpFetcher.submit(
                        {
                          phoneNumber: formData.phoneNumber,
                          intent: 'resend-otp',
                        },
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
              </signUpFetcher.Form>
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
