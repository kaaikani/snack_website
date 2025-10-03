'use client';

import { DialogFooter } from '~/components/ui/dialog';
import type React from 'react';
import {
  Form,
  Outlet,
  useLoaderData,
  useSearchParams,
  useLocation,
  useActionData,
  useNavigation,
  useFetcher,
} from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { getSessionStorage } from '~/sessions';
import { withZod } from '@remix-validated-form/with-zod';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import type { LoaderFunctionArgs, DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  sendPhoneOtp,
  resendPhoneOtp,
  getChannelsByCustomerPhonenumber,
} from '~/providers/customPlugins/customPlugin';
import {
  requestUpdateCustomerEmailAddress,
  updateCustomer,
  authenticate,
} from '~/providers/account/account';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import useToggleState from '~/utils/use-toggle-state';
import { replaceEmptyString } from '~/utils/validation';
import ToastNotification from '~/components/ToastNotification';

// shadcn/ui imports
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

// Lucide icons
import {
  MapPin,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  Check,
  Edit,
  Mail,
  Phone,
} from 'lucide-react';

// Your existing components
import { ErrorMessage } from '~/components/ErrorMessage';
import { HighlightedButton } from '~/components/HighlightedButton';
import AccountHeader from '~/components/account/AccountHeader';

enum FormIntent {
  UpdateEmail = 'updateEmail',
  UpdateDetails = 'updateDetails',
  SendPhoneOtp = 'sendPhoneOtp',
  VerifyPhoneOtp = 'verifyPhoneOtp',
}

export const validator = withZod(
  z.object({
    title: z.string(),
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    phoneNumber: z
      .string()
      .min(10, { message: 'Phone number must be 10 digits' })
      .max(10, { message: 'Phone number must be 10 digits' })
      .regex(/^\d{10}$/, { message: 'Phone number must contain only digits' })
      .optional(),
  }),
);

const changeEmailValidator = withZod(
  z.object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email('Must be a valid email'),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
);

const verifyPhoneOtpValidator = withZod(
  z.object({
    phoneNumber: z
      .string()
      .min(10, { message: 'Phone number must be 10 digits' })
      .max(10, { message: 'Phone number must be 10 digits' })
      .regex(/^\d{10}$/, { message: 'Phone number must contain only digits' }),
    otp: z.string().min(1, { message: 'OTP is required' }),
  }),
);

export async function loader({ request }: LoaderFunctionArgs) {
  const { activeCustomer } = await getActiveCustomerDetails({ request });

  if (!activeCustomer) {
    const sessionStorage = await getSessionStorage();
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );

    session.unset('authToken');
    session.unset('channelToken');

    return redirect('/sign-in', {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }

  return json({ activeCustomer });
}

function isFormError(err: unknown): err is FormError {
  return (err as FormError).message !== undefined;
}

function isEmailSavedResponse(
  response: unknown,
): response is EmailSavedResponse {
  return (response as EmailSavedResponse).newEmailAddress !== undefined;
}

function isCustomerUpdatedResponse(
  response: unknown,
): response is CustomerUpdatedResponse {
  return (response as CustomerUpdatedResponse).customerUpdated !== undefined;
}

function isPhoneOtpSentResponse(
  response: unknown,
): response is PhoneOtpSentResponse {
  return (response as PhoneOtpSentResponse).otpSent !== undefined;
}

function isPhoneOtpVerifiedResponse(
  response: unknown,
): response is PhoneOtpVerifiedResponse {
  return (response as PhoneOtpVerifiedResponse).phoneVerified !== undefined;
}

type FormError = {
  message: string;
  intent?: string;
};

type EmailSavedResponse = {
  newEmailAddress: string;
};

type CustomerUpdatedResponse = {
  customerUpdated: true;
};

type PhoneOtpSentResponse = {
  otpSent: boolean;
  message: string;
};

type PhoneOtpVerifiedResponse = {
  phoneVerified: boolean;
  phoneNumber: string;
};

export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData();
  const intent = body.get('intent') as FormIntent | null;
  const actionType = body.get('actionType') as string | null;

  const formError = (formError: FormError, init?: number | ResponseInit) => {
    return json<FormError>(formError, init);
  };

  if (intent === FormIntent.UpdateEmail) {
    const result = await changeEmailValidator.validate(body);

    if (result.error) {
      return validationError(result.error);
    }

    const { email, password } = result.data;

    const updateResult = await requestUpdateCustomerEmailAddress(
      password,
      email,
      { request },
    );

    if (updateResult.__typename !== 'Success') {
      return formError(
        { message: updateResult.message, intent: FormIntent.UpdateEmail },
        { status: 401 },
      );
    }

    return json<EmailSavedResponse>(
      { newEmailAddress: email },
      { status: 200 },
    );
  }

  if (intent === FormIntent.UpdateDetails) {
    const result = await validator.validate(body);

    if (result.error) {
      return validationError(result.error);
    }

    const { title, firstName, lastName } = result.data;
    const { activeCustomer } = await getActiveCustomerDetails({ request });

    if (!activeCustomer) {
      return formError({ message: 'Customer not found' }, { status: 404 });
    }

    await updateCustomer(
      {
        title,
        firstName,
        lastName,
        phoneNumber: activeCustomer.phoneNumber,
      },
      { request },
    );

    return json({ customerUpdated: true });
  }

  if (intent === FormIntent.SendPhoneOtp) {
    const result = await validator.validate(body);

    if (result.error) {
      return validationError(result.error);
    }

    const { phoneNumber } = result.data;

    if (!phoneNumber) {
      return formError(
        {
          message: 'Phone number is required',
          intent: FormIntent.SendPhoneOtp,
        },
        { status: 400 },
      );
    }

    try {
      const channels = await getChannelsByCustomerPhonenumber(phoneNumber);
      if (channels && channels.length > 0) {
        return formError(
          {
            message: 'Phone number is already registered',
            intent: FormIntent.SendPhoneOtp,
          },
          { status: 400 },
        );
      }

      const sent =
        actionType === 'resend-otp'
          ? await resendPhoneOtp(phoneNumber)
          : await sendPhoneOtp(phoneNumber);
      if (sent) {
        return json<PhoneOtpSentResponse>({
          otpSent: true,
          message:
            actionType === 'resend-otp'
              ? 'OTP resent successfully'
              : 'OTP sent successfully',
        });
      } else {
        return formError(
          {
            message:
              actionType === 'resend-otp'
                ? 'Failed to resend OTP'
                : 'Failed to send OTP',
            intent: FormIntent.SendPhoneOtp,
          },
          { status: 500 },
        );
      }
    } catch (error) {
      console.error('Error in sendPhoneOtp:', error);
      return formError(
        {
          message: 'An error occurred while sending OTP',
          intent: FormIntent.SendPhoneOtp,
        },
        { status: 500 },
      );
    }
  }

  if (intent === FormIntent.VerifyPhoneOtp) {
    const result = await verifyPhoneOtpValidator.validate(body);

    if (result.error) {
      return validationError(result.error);
    }

    const { phoneNumber, otp } = result.data;
    const { activeCustomer } = await getActiveCustomerDetails({ request });

    if (!activeCustomer) {
      return formError({ message: 'Customer not found' }, { status: 404 });
    }

    try {
      const channels = await getChannelsByCustomerPhonenumber(phoneNumber);
      const selectedChannelToken = channels[0]?.token;

      if (!selectedChannelToken) {
        return formError(
          {
            message: 'No channel associated with this phone number',
            intent: FormIntent.VerifyPhoneOtp,
          },
          { status: 403 },
        );
      }

      const result = await authenticate(
        {
          phoneOtp: {
            phoneNumber,
            code: otp,
          },
        },
        {
          request,
          customHeaders: { 'vendure-token': selectedChannelToken },
        },
      );

      if (
        '__typename' in result.result &&
        result.result.__typename === 'CurrentUser'
      ) {
        await updateCustomer(
          {
            title: activeCustomer.title,
            firstName: activeCustomer.firstName,
            lastName: activeCustomer.lastName,
            phoneNumber,
          },
          { request },
        );

        return json<PhoneOtpVerifiedResponse>({
          phoneVerified: true,
          phoneNumber,
        });
      }

      return formError(
        {
          message: 'Invalid OTP',
          intent: FormIntent.VerifyPhoneOtp,
        },
        { status: 401 },
      );
    } catch (error) {
      console.error('Error in verifyPhoneOtp:', error);
      return formError(
        {
          message: 'An error occurred during OTP verification',
          intent: FormIntent.VerifyPhoneOtp,
        },
        { status: 500 },
      );
    }
  }

  return formError({ message: 'No valid form intent' }, { status: 401 });
}

export default function AccountDashboard() {
  const { activeCustomer } = useLoaderData<typeof loader>();
  const { firstName, lastName, emailAddress, phoneNumber, title } =
    activeCustomer!;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const actionDataHook = useActionData<typeof action>();
  const { state } = useNavigation();
  const sendOtpFetcher = useFetcher();
  const verifyOtpFetcher = useFetcher();
  const editFormOtpFetcher = useFetcher();

  // Account details state
  const [formError, setFormError] = useState<FormError>();
  const [emailSavedResponse, setEmailSavedResponse] =
    useState<EmailSavedResponse>();
  const [phoneOtpSentResponse, setPhoneOtpSentResponse] =
    useState<PhoneOtpSentResponse>();
  const [phoneOtpVerifiedResponse, setPhoneOtpVerifiedResponse] =
    useState<PhoneOtpVerifiedResponse>();
  const [showChangeEmailModal, openChangeEmailModal, closeChangeEmailModal] =
    useToggleState(false);
  const [showChangePhoneModal, openChangePhoneModal, closeChangePhoneModal] =
    useToggleState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [editPhoneNumberInput, setEditPhoneNumberInput] = useState(
    phoneNumber || '',
  );
  const emailInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const prevActionData = useRef<typeof actionDataHook>();

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fullName = `${title ? title + ' ' : ''}${firstName} ${lastName}`;
  const isAccountDetailsPage = location.pathname === '/account';

  const showNotification = (
    type: 'success' | 'error',
    title: string,
    message: string,
  ) => {
    if (!showToast) {
      setToastType(type);
      setToastTitle(title);
      setToastMessage(message);
      setShowToast(true);
    }
  };

  const closeToast = () => {
    setShowToast(false);
  };

  useEffect(() => {
    if (searchParams.get('reload') === 'true') {
      const url = new URL(window.location.href);
      url.searchParams.delete('reload');
      window.history.replaceState({}, '', url.toString());
      window.location.reload();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!actionDataHook || actionDataHook === prevActionData.current) {
      return;
    }

    prevActionData.current = actionDataHook;

    if (isEmailSavedResponse(actionDataHook)) {
      setEmailSavedResponse(actionDataHook);
      closeChangeEmailModal();
      showNotification(
        'success',
        'Email Updated',
        'Email address updated successfully.',
      );
      return;
    }

    if (isCustomerUpdatedResponse(actionDataHook)) {
      setIsEditing(false);
      setFormError(undefined);
      showNotification(
        'success',
        'Details Updated',
        'Your details have been updated.',
      );
      return;
    }

    if (isPhoneOtpSentResponse(actionDataHook)) {
      setPhoneOtpSentResponse(actionDataHook);
      setPhoneNumberInput(editPhoneNumberInput);
      openChangePhoneModal();
      showNotification('success', 'OTP Sent', actionDataHook.message);
      return;
    }

    if (isPhoneOtpVerifiedResponse(actionDataHook)) {
      setPhoneOtpSentResponse(undefined);
      setPhoneOtpVerifiedResponse(actionDataHook);
      setEditPhoneNumberInput(actionDataHook.phoneNumber);
      closeChangePhoneModal();
      showNotification(
        'success',
        'Phone Number Updated',
        'Phone number verified and updated successfully.',
      );
      return;
    }

    if (isFormError(actionDataHook)) {
      setFormError(actionDataHook);
      showNotification('error', 'Error', actionDataHook.message);
      return;
    }
  }, [actionDataHook, openChangePhoneModal]);

  useEffect(() => {
    formRef.current?.reset();
    setEditPhoneNumberInput(phoneNumber || '');
  }, [isEditing, phoneNumber]);

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <ToastNotification
          show={showToast}
          type={toastType}
          title={toastTitle}
          message={toastMessage}
          onClose={closeToast}
        />
      )}

      {/* Email Change Modal */}
      <Dialog open={showChangeEmailModal} onOpenChange={closeChangeEmailModal}>
        <DialogContent className="bg-white sm:max-w-md">
          <ValidatedForm validator={changeEmailValidator} method="post">
            <DialogHeader>
              <DialogTitle>{t('account.changeEmailModal.title')}</DialogTitle>
              <DialogDescription>
                {t('account.changeEmailModal.heading')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Email</Label>
                <p className="text-sm text-muted-foreground">
                  <strong>{emailAddress}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="hidden"
                  name="intent"
                  value={FormIntent.UpdateEmail}
                />
                <Label htmlFor="email">
                  {t('account.changeEmailModal.new')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  ref={emailInputRef}
                  autoFocus
                  required
                  placeholder="Enter new email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Confirm with your password"
                />
              </div>

              {formError && formError.intent === FormIntent.UpdateEmail && (
                <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    {formError.message}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeChangeEmailModal}
              >
                {t('common.cancel')}
              </Button>
              <HighlightedButton
                type="submit"
                isSubmitting={state === 'submitting'}
              >
                {state === 'submitting' ? 'Saving...' : t('common.save')}
              </HighlightedButton>
            </DialogFooter>
          </ValidatedForm>
        </DialogContent>
      </Dialog>

      {/* Phone Number Change Modal */}
      <Dialog open={showChangePhoneModal} onOpenChange={closeChangePhoneModal}>
        <DialogContent className="bg-white sm:max-w-md">
          {!phoneOtpSentResponse ? (
            <ValidatedForm
              validator={validator}
              method="post"
              formRef={formRef}
              onSubmit={() =>
                sendOtpFetcher.submit(formRef.current, { method: 'post' })
              }
            >
              <DialogHeader>
                <DialogTitle>Change Phone Number</DialogTitle>
                <DialogDescription>
                  Enter your new phone number to receive an OTP.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <input
                    type="hidden"
                    name="intent"
                    value={FormIntent.SendPhoneOtp}
                  />
                  <Label htmlFor="phoneNumber">New Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPhoneNumberInput(cleaned.slice(0, 10));
                    }}
                    ref={phoneInputRef}
                    autoFocus
                    required
                    placeholder="Enter new phone number"
                  />
                  {phoneNumberInput && phoneNumberInput.length !== 10 && (
                    <p className="text-sm text-red-600">
                      Please enter a valid 10-digit phone number.
                    </p>
                  )}
                </div>

                {formError && formError.intent === FormIntent.SendPhoneOtp && (
                  <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      {formError.message}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeChangePhoneModal}
                >
                  {t('common.cancel')}
                </Button>
                <HighlightedButton
                  type="submit"
                  isSubmitting={sendOtpFetcher.state !== 'idle'}
                  disabled={phoneNumberInput.length !== 10}
                >
                  {sendOtpFetcher.state !== 'idle' ? 'Sending...' : 'Send OTP'}
                </HighlightedButton>
              </DialogFooter>
            </ValidatedForm>
          ) : (
            <ValidatedForm
              validator={verifyPhoneOtpValidator}
              method="post"
              formRef={formRef}
              onSubmit={() =>
                verifyOtpFetcher.submit(formRef.current, { method: 'post' })
              }
            >
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  Enter the OTP sent to {phoneNumberInput}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <input
                    type="hidden"
                    name="intent"
                    value={FormIntent.VerifyPhoneOtp}
                  />
                  <input
                    type="hidden"
                    name="phoneNumber"
                    value={phoneNumberInput}
                  />
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    placeholder="Enter OTP"
                  />
                </div>

                {formError &&
                  formError.intent === FormIntent.VerifyPhoneOtp && (
                    <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">
                        {formError.message}
                      </p>
                    </div>
                  )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeChangePhoneModal}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    sendOtpFetcher.submit(
                      {
                        phoneNumber: phoneNumberInput,
                        intent: FormIntent.SendPhoneOtp,
                        actionType: 'resend-otp',
                      },
                      { method: 'post' },
                    )
                  }
                  disabled={sendOtpFetcher.state !== 'idle'}
                >
                  {sendOtpFetcher.state !== 'idle'
                    ? 'Resending...'
                    : 'Resend OTP'}
                </Button>
                <HighlightedButton
                  type="submit"
                  isSubmitting={verifyOtpFetcher.state !== 'idle'}
                >
                  {verifyOtpFetcher.state !== 'idle'
                    ? 'Verifying...'
                    : 'Verify OTP'}
                </HighlightedButton>
              </DialogFooter>
            </ValidatedForm>
          )}
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gray-50">
        <AccountHeader
          activeCustomer={{
            ...activeCustomer,
            phoneNumber:
              phoneOtpVerifiedResponse?.phoneNumber || phoneNumber || null,
          }}
        />

        <div>
          {isAccountDetailsPage ? (
            <AccountDetailsContent
              activeCustomer={{
                ...activeCustomer,
                phoneNumber:
                  phoneOtpVerifiedResponse?.phoneNumber || phoneNumber,
              }}
              fullName={fullName}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              emailSavedResponse={emailSavedResponse}
              openChangeEmailModal={openChangeEmailModal}
              openChangePhoneModal={openChangePhoneModal}
              formError={formError}
              formRef={formRef}
              state={state}
              t={t}
              editPhoneNumberInput={editPhoneNumberInput}
              setEditPhoneNumberInput={setEditPhoneNumberInput}
              editFormOtpFetcher={editFormOtpFetcher}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </>
  );
}

function AccountDetailsContent({
  activeCustomer,
  fullName,
  isEditing,
  setIsEditing,
  emailSavedResponse,
  openChangeEmailModal,
  openChangePhoneModal,
  formError,
  formRef,
  state,
  t,
  editPhoneNumberInput,
  setEditPhoneNumberInput,
  editFormOtpFetcher,
}: {
  activeCustomer: any;
  fullName: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  emailSavedResponse: EmailSavedResponse | undefined;
  openChangeEmailModal: () => void;
  openChangePhoneModal: () => void;
  formError: FormError | undefined;
  formRef: React.RefObject<HTMLFormElement>;
  state: string;
  t: any;
  editPhoneNumberInput: string;
  setEditPhoneNumberInput: (value: string) => void;
  editFormOtpFetcher: ReturnType<typeof useFetcher>;
}) {
  const { firstName, lastName, title, phoneNumber, emailAddress } =
    activeCustomer;

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Contact Information Card */}
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-visible">
            {isEditing ? (
              <div className="space-y-6">
                <ValidatedForm
                  validator={validator}
                  formRef={formRef}
                  method="post"
                  id="details"
                  defaultValues={{
                    title: title ?? 'None',
                    firstName,
                    lastName,
                    phoneNumber: phoneNumber || '',
                  }}
                >
                  <input
                    type="hidden"
                    name="intent"
                    value={FormIntent.UpdateDetails}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <div className="max-w-xs">
                        <Label htmlFor="title">Title</Label>
                        <Select name="title" defaultValue={title || 'None'}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                            <SelectItem value="Miss.">Miss.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Prof.">Prof.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        className="mt-1"
                        defaultValue={firstName || ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        className="mt-1"
                        defaultValue={lastName || ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          className="mt-1"
                          value={editPhoneNumberInput}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setEditPhoneNumberInput(cleaned.slice(0, 10));
                          }}
                        />
                        {editPhoneNumberInput &&
                          editPhoneNumberInput !== phoneNumber && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                editFormOtpFetcher.submit(
                                  {
                                    phoneNumber: editPhoneNumberInput,
                                    intent: FormIntent.SendPhoneOtp,
                                  },
                                  { method: 'post' },
                                )
                              }
                              disabled={
                                editPhoneNumberInput.length !== 10 ||
                                editFormOtpFetcher.state !== 'idle'
                              }
                            >
                              {editFormOtpFetcher.state !== 'idle'
                                ? 'Sending...'
                                : 'Send OTP'}
                            </Button>
                          )}
                      </div>
                      {editPhoneNumberInput &&
                        editPhoneNumberInput.length !== 10 && (
                          <p className="text-sm text-red-600 mt-1">
                            Please enter a valid 10-digit phone number.
                          </p>
                        )}
                    </div>
                  </div>

                  {formError &&
                    formError.intent === FormIntent.UpdateDetails && (
                      <div className="mt-4">
                        <ErrorMessage
                          heading="Error"
                          message={formError.message}
                        />
                      </div>
                    )}

                  <div className="flex gap-3 pt-4">
                    <HighlightedButton
                      type="submit"
                      isSubmitting={state === 'submitting'}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {state === 'submitting' ? 'Saving...' : 'Save'}
                    </HighlightedButton>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditPhoneNumberInput(phoneNumber || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </ValidatedForm>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </Label>
                    <p className="text-sm mt-1">
                      {replaceEmptyString(fullName)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </Label>
                    <p className="text-sm mt-1">
                      {replaceEmptyString(phoneNumber) || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-x-3 flex">
                <p className="font-medium">{emailAddress}</p>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 hover:bg-green-100"
                >
                  Verified
                </Badge>
              </div>
              <Button variant="outline" onClick={openChangeEmailModal}>
                Change Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phone Number Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-x-3 flex">
                <p className="font-medium">{phoneNumber || 'Not provided'}</p>
                {phoneNumber && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    Verified
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={openChangePhoneModal}>
                Change Phone Number
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
