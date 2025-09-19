'use client';

import { DialogFooter } from '~/components/ui/dialog';

import type React from 'react';
import {
  Form,
  Outlet,
  useLoaderData,
  useSearchParams,
  NavLink,
  useLocation,
  useActionData,
  useNavigation,
} from '@remix-run/react';
import {
  type LoaderFunctionArgs,
  json,
  redirect,
  type DataFunctionArgs,
} from '@remix-run/server-runtime';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { getSessionStorage } from '~/sessions';
import { withZod } from '@remix-validated-form/with-zod';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import {
  requestUpdateCustomerEmailAddress,
  updateCustomer,
} from '~/providers/account/account';
import useToggleState from '~/utils/use-toggle-state';
import { replaceEmptyString } from '~/utils/validation';

// shadcn/ui imports - Fixed Button import
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
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
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
  Award,
} from 'lucide-react';

// Your existing components (keeping these as they have custom logic)
import { ErrorMessage } from '~/components/ErrorMessage';
import { HighlightedButton } from '~/components/HighlightedButton';

enum FormIntent {
  UpdateEmail = 'updateEmail',
  UpdateDetails = 'updateDetails',
}

export const validator = withZod(
  z.object({
    title: z.string(),
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
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

export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData();
  const intent = body.get('intent') as FormIntent | null;

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
    // Keep the existing phoneNumber from activeCustomer
    const { activeCustomer } = await getActiveCustomerDetails({ request });

    if (!activeCustomer) {
      return formError({ message: 'Customer not found' }, { status: 404 });
    }

    await updateCustomer(
      { title, firstName, lastName, phoneNumber: activeCustomer.phoneNumber },
      { request },
    );

    return json({ customerUpdated: true });
  }

  return formError({ message: 'No valid form intent' }, { status: 401 });
}

export default function AccountDashboard() {
  const { activeCustomer } = useLoaderData<typeof loader>();
  const { firstName, lastName, emailAddress, phoneNumber, title } =
    activeCustomer!;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const actionDataHook = useActionData<typeof action>();
  const { state } = useNavigation();

  // Account details state
  const [formError, setFormError] = useState<FormError>();
  const [emailSavedResponse, setEmailSavedResponse] =
    useState<EmailSavedResponse>();
  const [showChangeEmailModal, openChangeEmailModal, closeChangeEmailModal] =
    useToggleState(false);
  const [isEditing, setIsEditing] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fullName = `${title ? title + ' ' : ''}${firstName} ${lastName}`;
  const isAccountDetailsPage = location.pathname === '/account';

  useEffect(() => {
    if (searchParams.get('reload') === 'true') {
      const url = new URL(window.location.href);
      url.searchParams.delete('reload');
      window.history.replaceState({}, '', url.toString());
      window.location.reload();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!actionDataHook) {
      return;
    }

    if (isEmailSavedResponse(actionDataHook)) {
      setEmailSavedResponse(actionDataHook);
      closeChangeEmailModal();
      return;
    }

    if (isCustomerUpdatedResponse(actionDataHook)) {
      setIsEditing(false);
      setFormError(undefined);
      return;
    }

    if (isFormError(actionDataHook)) {
      setFormError(actionDataHook);
      return;
    }
  }, [actionDataHook]);

  useEffect(() => {
    formRef.current?.reset();
  }, [isEditing]);

  const navigation = [
    {
      name: 'Details',
      href: '/account',
      icon: User,
    },
    {
      name: 'Addresses',
      href: '/account/addresses',
      icon: MapPin,
    },
    {
      name: 'PurchaseHistory',
      href: '/account/history',
      icon: ShoppingBag,
    },
    {
      name: 'Reward Points History',
      href: '/account/loyaltypointstransactions',
      icon: Award,
    },
  ];

  return (
    <>
      {/* Email Change Modal */}
      <Dialog open={showChangeEmailModal} onOpenChange={closeChangeEmailModal}>
        <DialogContent className="sm:max-w-md">
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

      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white shadow-xl">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center justify-between px-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    type="button"
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SidebarContent
                    navigation={navigation}
                    activeCustomer={activeCustomer}
                    t={t}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 pt-[90px]">
          <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
            <SidebarContent
              navigation={navigation}
              activeCustomer={activeCustomer}
              t={t}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-64 pt-[80px]">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">{t('account.myAccount')}</h1>
          </div>

          {/* Page content */}
          {isAccountDetailsPage ? (
            <AccountDetailsContent
              activeCustomer={activeCustomer}
              fullName={fullName}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              emailSavedResponse={emailSavedResponse}
              openChangeEmailModal={openChangeEmailModal}
              formError={formError}
              formRef={formRef}
              state={state}
              t={t}
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
  formError,
  formRef,
  state,
  t,
}: {
  activeCustomer: any;
  fullName: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  emailSavedResponse: EmailSavedResponse | undefined;
  openChangeEmailModal: () => void;
  formError: FormError | undefined;
  formRef: React.RefObject<HTMLFormElement>;
  state: string;
  t: any;
}) {
  const { firstName, lastName, title, phoneNumber, emailAddress } =
    activeCustomer;

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <div className="px-6 py-8 border-b">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {firstName} {lastName}
        </p>
      </div>

      {/* Main Content */}
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
                      onClick={() => setIsEditing(false)}
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
                      {replaceEmptyString(phoneNumber) || '+1 (555) 123-4567'}
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
        {/* <Card>
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
        </Card> */}

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
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 hover:bg-green-100"
                >
                  Verified
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SidebarContent({
  navigation,
  activeCustomer,
  t,
  onNavigate,
}: {
  navigation: any[];
  activeCustomer: any;
  t: any;
  onNavigate?: () => void;
}) {
  const { firstName, lastName, emailAddress, phoneNumber } = activeCustomer;
  const user = { firstName, lastName, emailAddress, phoneNumber };

  const links = navigation.map((item) => ({
    to: item.href,
    label: item.name,
    icon: item.icon,
  }));

  return <Sidebar user={user} links={links} onNavigate={onNavigate} />;
}

function Sidebar({
  user,
  links,
  onNavigate,
}: {
  user: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string;
  };
  links: { to: string; label: string; icon: React.ElementType }[];
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* User profile section */}
      <div className="px-6 py-8 border-b flex space-x-3">
        <a
          href="/home"
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
        >
          <img src="/KK-Logo.png" alt="logo" className="w-32 h-auto" />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            end={to === '/account'}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-5 w-5 mr-3 flex-shrink-0 ${
                    isActive ? 'text-blue-700' : ''
                  }`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-6 border-t">
        <Form method="post" action="/api/logout">
          <button
            type="submit"
            className="group flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md w-full transition-colors"
            onClick={() => {
              setTimeout(() => {
                window.location.href = '/';
              }, 50);
            }}
          >
            <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
            {t('account.signOut')}
          </button>
        </Form>
      </div>
    </div>
  );
}
