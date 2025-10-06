import React, { useState } from 'react';
import { NavLink, Form } from '@remix-run/react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: 'Details', href: '/account', icon: User },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Purchase History', href: '/account/history', icon: ShoppingBag },
    {
      name: 'Loyalty Points',
      href: '/account/loyaltypointstransactions',
      icon: Award,
    },
    { name: 'Sign Out', href: '/api/logout', icon: LogOut, isSignOut: true },
  ];

  return (
    <header className="sticky top-[64px] bg-[#ffedc7] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between py-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
          <button
            type="button"
            className="p-2 rounded-full text-[#FF4D4D] hover:bg-red-50 transition-all duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white rounded-b-xl shadow-lg">
            <nav className="flex flex-col p-4 space-y-2">
              {navigation.map((item) =>
                item.isSignOut ? (
                  <Form key={item.href} method="post" action={item.href}>
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-[#FF4D4D] rounded-md transition-all duration-200"
                      onClick={() => {
                        setMenuOpen(false);
                        setTimeout(() => (window.location.href = '/'), 50);
                      }}
                    >
                      <item.icon className="h-5 w-5 mr-3 text-[#FF4D4D]" />
                      {item.name}
                    </button>
                  </Form>
                ) : (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/account'}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                        isActive
                          ? 'bg-red-50 text-[#FF4D4D]'
                          : 'text-gray-700 hover:bg-red-50 hover:text-[#FF4D4D]'
                      }`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3 text-[#FF4D4D]" />
                    {item.name}
                  </NavLink>
                ),
              )}
            </nav>
          </div>
        )}

        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col items-center py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <nav className="flex space-x-6 mt-4">
            {navigation.map((item) =>
              item.isSignOut ? (
                <Form key={item.href} method="post" action={item.href}>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-[#FF4D4D] rounded-md transition-all duration-200"
                    onClick={() =>
                      setTimeout(() => (window.location.href = '/'), 50)
                    }
                  >
                    <item.icon className="h-5 w-5 mr-2 text-[#FF4D4D]" />
                    {item.name}
                  </button>
                </Form>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/account'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-red-50 text-[#FF4D4D]'
                        : 'text-gray-700 hover:bg-red-50 hover:text-[#FF4D4D]'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-2 text-[#FF4D4D]" />
                  {item.name}
                </NavLink>
              ),
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
