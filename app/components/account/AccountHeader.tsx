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

interface AccountHeaderProps {
  activeCustomer: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string | null | undefined;
  };
}

export default function AccountHeader({ activeCustomer }: AccountHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: 'Account Details', href: '/account', icon: User },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Purchase History', href: '/account/history', icon: ShoppingBag },
    {
      name: 'Reward Points History',
      href: '/account/loyaltypointstransactions',
      icon: Award,
    },
    { name: 'Sign Out', href: '/api/logout', icon: LogOut, isSignOut: true },
  ];

  return (
    <header className="shadow-sm top-0 z-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-semibold text-center w-full">
          {t('account.myAccount')}
        </h1>
        <button
          type="button"
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100 ml-2 shrink-0"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            {navigation.map((item) =>
              item.isSignOut ? (
                <Form key={item.href} method="post" action={item.href}>
                  <button
                    type="submit"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md w-full transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 50);
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {t('account.signOut')}
                  </button>
                </Form>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/account'}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ),
            )}
          </nav>
        </div>
      )}

      {/* Desktop header (centered) */}
      <div className="hidden lg:flex flex-col items-center px-6 py-4">
        <h1 className="text-xl font-semibold text-center">
          {t('account.myAccount')}
        </h1>
        <nav className="flex space-x-4 mt-3">
          {navigation.map((item) =>
            item.isSignOut ? (
              <Form key={item.href} method="post" action={item.href}>
                <button
                  type="submit"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => {
                    setTimeout(() => {
                      window.location.href = '/';
                    }, 50);
                  }}
                >
                  <item.icon className="h-5 w-5 mr-2 flex-shrink-0" />
                  {t('account.signOut')}
                </button>
              </Form>
            ) : (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/account'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-2 flex-shrink-0" />
                {item.name}
              </NavLink>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
