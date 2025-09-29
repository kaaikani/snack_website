import React, { useState } from 'react';
import { NavLink, Form } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  Award,
} from 'lucide-react';

interface AccountSidebarProps {
  activeCustomer: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string | null | undefined;
  };
  currentPath?: string;
}

export default function AccountSidebar({
  activeCustomer,
  currentPath,
}: AccountSidebarProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className=" inset-0 z-50 lg:hidden">
          <div
            className=" inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className=" inset-y-0 left-0 w-80 max-w-full  shadow-xl z-50">
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
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:inset-y-0 lg:z-30">
        <div className="flex flex-col flex-grow border-r overflow-y-auto">
          <SidebarContent
            navigation={navigation}
            activeCustomer={activeCustomer}
            t={t}
          />
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">{t('account.myAccount')}</h1>
      </div>
    </>
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

  return <Sidebar user={user} links={links} onNavigate={onNavigate} t={t} />;
}

function Sidebar({
  user,
  links,
  onNavigate,
  t,
}: {
  user: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string | null | undefined;
  };
  links: { to: string; label: string; icon: React.ElementType }[];
  onNavigate?: () => void;
  t: any;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* User profile section */}
      {/* <div className="px-6 py-8 border-b flex space-x-3 flex-shrink-0">
        <a
          href="/home"
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
        >
          <img src="/KK-Logo.png" alt="logo" className="w-32 h-auto" />
        </a>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
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
      <div className="px-4 py-6 border-t flex-shrink-0">
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
