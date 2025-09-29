'use client';

import { Link, useLoaderData } from '@remix-run/react';
import {
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from './SearchBar';
import { useState, useEffect } from 'react';
import { GoogleLoginButton } from '../Google/GoogleLoginButton';
import { SignInPromptModal } from '~/components/modal/SignInPromptModal';

interface Collection {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: {
    id: string;
    preview: string;
  } | null;
}

const CoinIcon = ({ points }: { points: number | null }) => (
  <div className="relative flex items-center gap-1">
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD93D]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
    <span className="text-xs font-medium text-[#1F0322] hidden sm:inline">
      {points ?? '0'} Points
    </span>
    <span className="text-sm font-sm text-[#1F0322] sm:hidden">
      {points ?? '0'}
    </span>
  </div>
);

export function Header({
  onCartIconClick,
  cartQuantity,
  collections,
  isCartOpen,
  loyaltyPoints,
  isSignedIn,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
  collections: Collection[];
  isCartOpen: boolean;
  loyaltyPoints: number | null;
  isSignedIn: boolean;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      setIsHeaderVisible(false);
      return;
    }

    setIsHeaderVisible(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 0) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isCartOpen]);

  const handleShowSignInModal = () => {
    setShowSignInModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.mobile-menu') &&
        !target.closest('.mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`text-white top-0 left-0 w-full z-[1] transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Black Bar Above Navbar */}
      <div className="bg-[#fbc531] h-7 mx-3 rounded-xl justify-center mt-2  relative overflow-hidden">
        <div className="animate-marquee whitespace-nowrap absolute left-0 -translate-y-1/2 flex items-center h-full">
          <span className="text-[#1F0322] text-sm font-medium mr-12 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8.25 10.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              <path
                fillRule="evenodd"
                d="M14.25 5.25a5.25 5.25 0 0 0-10.5 0v1.5H2.25a.75.75 0 0 0 0 1.5H3v.375C3 9.776 4.224 11 5.75 11.25h12.5c1.527 0 2.75-1.224 2.75-2.75V8.25h.75a.75.75 0 0 0 0-1.5H21v-1.5h-.75V5.25A5.25 5.25 0 0 0 14.25 0h-4.5A5.25 5.25 0 0 0 4.5 5.25v1.5H3.75c-.966 0-1.75.784-1.75 1.75v.375A2.75 2.75 0 0 0 4.75 11.25H18.5a.75.75 0 0 1 0 1.5H5.75A4.25 4.25 0 0 1 1.5 8.5v-.375c0-1.526 1.224-2.75 2.75-2.75H4.5V5.25A3.75 3.75 0 0 1 8.25 1.5h4.5A3.75 3.75 0 0 1 16.5 5.25v1.5h-.75a.75.75 0 0 1 0-1.5h.75V11.5a.75.75 0 0 0 1.5 0V8.25h1.5A4.25 4.25 0 0 1 22.5 12.5v.375c0 1.526-1.224 2.75-2.75 2.75H18.75a.75.75 0 0 1 0-1.5h1.5a2.75 2.75 0 0 0 2.75-2.75V11.5h-.75a.75.75 0 0 1 0-1.5H22.5V8.25h-.75V5.25Zm-3 1.5V5.25a3.75 3.75 0 0 0-3.75-3.75h-4.5A3.75 3.75 0 0 0 6.75 5.25v1.5H11.5a.75.75 0 0 1 0 1.5H6.75v.75c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75V8.25h-.75a.75.75 0 0 1 0-1.5h.75ZM6 19.5H18a3 3 0 0 0 3-3V15.5a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v1A3 3 0 0 0 6 19.5ZM19.5 12a.75.75 0 0 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M12 1.5A3.75 3.75 0 0 0 8.25 5.25v6.75a.75.75 0 0 0 1.5 0V7.5h1.968A7.506 7.506 0 0 1 18 12.75v.75a.75.75 0 0 0 1.5 0v-.75a9 9 0 0 0-7.5-8.988V1.5Z"
                clipRule="evenodd"
              />
            </svg>
            Free delivery on orders above 499 pan India.
          </span>
          <span className="text-[#1F0322] text-sm font-medium mr-12 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8.25 10.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              <path
                fillRule="evenodd"
                d="M14.25 5.25a5.25 5.25 0 0 0-10.5 0v1.5H2.25a.75.75 0 0 0 0 1.5H3v.375C3 9.776 4.224 11 5.75 11.25h12.5c1.527 0 2.75-1.224 2.75-2.75V8.25h.75a.75.75 0 0 0 0-1.5H21v-1.5h-.75V5.25A5.25 5.25 0 0 0 14.25 0h-4.5A5.25 5.25 0 0 0 4.5 5.25v1.5H3.75c-.966 0-1.75.784-1.75 1.75v.375A2.75 2.75 0 0 0 4.75 11.25H18.5a.75.75 0 0 1 0 1.5H5.75A4.25 4.25 0 0 1 1.5 8.5v-.375c0-1.526 1.224-2.75 2.75-2.75H4.5V5.25A3.75 3.75 0 0 1 8.25 1.5h4.5A3.75 3.75 0 0 1 16.5 5.25v1.5h-.75a.75.75 0 0 1 0-1.5h.75V11.5a.75.75 0 0 0 1.5 0V8.25h1.5A4.25 4.25 0 0 1 22.5 12.5v.375c0 1.526-1.224 2.75-2.75 2.75H18.75a.75.75 0 0 1 0-1.5h1.5a2.75 2.75 0 0 0 2.75-2.75V11.5h-.75a.75.75 0 0 1 0-1.5H22.5V8.25h-.75V5.25Zm-3 1.5V5.25a3.75 3.75 0 0 0-3.75-3.75h-4.5A3.75 3.75 0 0 0 6.75 5.25v1.5H11.5a.75.75 0 0 1 0 1.5H6.75v.75c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75V8.25h-.75a.75.75 0 0 1 0-1.5h.75ZM6 19.5H18a3 3 0 0 0 3-3V15.5a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v1A3 3 0 0 0 6 19.5ZM19.5 12a.75.75 0 0 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M12 1.5A3.75 3.75 0 0 0 8.25 5.25v6.75a.75.75 0 0 0 1.5 0V7.5h1.968A7.506 7.506 0 0 1 18 12.75v.75a.75.75 0 0 0 1.5 0v-.75a9 9 0 0 0-7.5-8.988V1.5Z"
                clipRule="evenodd"
              />
            </svg>
            Free delivery on orders above 499 pan India.
          </span>
          <span className="text-[#1F0322] text-sm font-medium mr-12 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8.25 10.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              <path
                fillRule="evenodd"
                d="M14.25 5.25a5.25 5.25 0 0 0-10.5 0v1.5H2.25a.75.75 0 0 0 0 1.5H3v.375C3 9.776 4.224 11 5.75 11.25h12.5c1.527 0 2.75-1.224 2.75-2.75V8.25h.75a.75.75 0 0 0 0-1.5H21v-1.5h-.75V5.25A5.25 5.25 0 0 0 14.25 0h-4.5A5.25 5.25 0 0 0 4.5 5.25v1.5H3.75c-.966 0-1.75.784-1.75 1.75v.375A2.75 2.75 0 0 0 4.75 11.25H18.5a.75.75 0 0 1 0 1.5H5.75A4.25 4.25 0 0 1 1.5 8.5v-.375c0-1.526 1.224-2.75 2.75-2.75H4.5V5.25A3.75 3.75 0 0 1 8.25 1.5h4.5A3.75 3.75 0 0 1 16.5 5.25v1.5h-.75a.75.75 0 0 1 0-1.5h.75V11.5a.75.75 0 0 0 1.5 0V8.25h1.5A4.25 4.25 0 0 1 22.5 12.5v.375c0 1.526-1.224 2.75-2.75 2.75H18.75a.75.75 0 0 1 0-1.5h1.5a2.75 2.75 0 0 0 2.75-2.75V11.5h-.75a.75.75 0 0 1 0-1.5H22.5V8.25h-.75V5.25Zm-3 1.5V5.25a3.75 3.75 0 0 0-3.75-3.75h-4.5A3.75 3.75 0 0 0 6.75 5.25v1.5H11.5a.75.75 0 0 1 0 1.5H6.75v.75c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75V8.25h-.75a.75.75 0 0 1 0-1.5h.75ZM6 19.5H18a3 3 0 0 0 3-3V15.5a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v1A3 3 0 0 0 6 19.5ZM19.5 12a.75.75 0 0 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M12 1.5A3.75 3.75 0 0 0 8.25 5.25v6.75a.75.75 0 0 0 1.5 0V7.5h1.968A7.506 7.506 0 0 1 18 12.75v.75a.75.75 0 0 0 1.5 0v-.75a9 9 0 0 0-7.5-8.988V1.5Z"
                clipRule="evenodd"
              />
            </svg>
            Free delivery on orders above 499 pan India.
          </span>
          <span className="text-[#1F0322] text-sm font-medium mr-12 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8.25 10.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              <path
                fillRule="evenodd"
                d="M14.25 5.25a5.25 5.25 0 0 0-10.5 0v1.5H2.25a.75.75 0 0 0 0 1.5H3v.375C3 9.776 4.224 11 5.75 11.25h12.5c1.527 0 2.75-1.224 2.75-2.75V8.25h.75a.75.75 0 0 0 0-1.5H21v-1.5h-.75V5.25A5.25 5.25 0 0 0 14.25 0h-4.5A5.25 5.25 0 0 0 4.5 5.25v1.5H3.75c-.966 0-1.75.784-1.75 1.75v.375A2.75 2.75 0 0 0 4.75 11.25H18.5a.75.75 0 0 1 0 1.5H5.75A4.25 4.25 0 0 1 1.5 8.5v-.375c0-1.526 1.224-2.75 2.75-2.75H4.5V5.25A3.75 3.75 0 0 1 8.25 1.5h4.5A3.75 3.75 0 0 1 16.5 5.25v1.5h-.75a.75.75 0 0 1 0-1.5h.75V11.5a.75.75 0 0 0 1.5 0V8.25h1.5A4.25 4.25 0 0 1 22.5 12.5v.375c0 1.526-1.224 2.75-2.75 2.75H18.75a.75.75 0 0 1 0-1.5h1.5a2.75 2.75 0 0 0 2.75-2.75V11.5h-.75a.75.75 0 0 1 0-1.5H22.5V8.25h-.75V5.25Zm-3 1.5V5.25a3.75 3.75 0 0 0-3.75-3.75h-4.5A3.75 3.75 0 0 0 6.75 5.25v1.5H11.5a.75.75 0 0 1 0 1.5H6.75v.75c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75V8.25h-.75a.75.75 0 0 1 0-1.5h.75ZM6 19.5H18a3 3 0 0 0 3-3V15.5a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v1A3 3 0 0 0 6 19.5ZM19.5 12a.75.75 0 0 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M12 1.5A3.75 3.75 0 0 0 8.25 5.25v6.75a.75.75 0 0 0 1.5 0V7.5h1.968A7.506 7.506 0 0 1 18 12.75v.75a.75.75 0 0 0 1.5 0v-.75a9 9 0 0 0-7.5-8.988V1.5Z"
                clipRule="evenodd"
              />
            </svg>
            Free delivery on orders above 499 pan India.
          </span>
        </div>
      </div>

      <div className="mx-1 p-2 sm:p-4 flex items-center relative">
        {/* Logo */}
        <div className="w-20 sm:w-40 text-black text-xs sm:text-lg font-bold">
          <Link to="/">
            <h3 className="w-full h-full">South Mithai</h3>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6 flex-grow justify-center">
          <div
            className="relative"
            onMouseEnter={() => setIsCollectionsOpen(true)}
            onMouseLeave={() => setIsCollectionsOpen(false)}
          >
            <button className="text-gray-700 hover:text-[#fb6331] flex items-center justify-center space-x-1 relative group px-1">
              <div className="relative">
                <span>Shop All</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#fb6331] transition-all duration-300 group-hover:w-full"></span>
              </div>
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button>

            <div
              className={`absolute top-[50px] left-1/2 -translate-x-1/2 w-[1000px] bg-white shadow-lg rounded-lg py-6 mt-1 transition-all duration-300 ease-in-out transform origin-top-left z-[1]${
                isCollectionsOpen
                  ? 'opacity-100 translate-y-0 visible'
                  : 'opacity-0 -translate-y-2 invisible'
              }`}
            >
              <div className="grid grid-cols-5 gap-6 px-8">
                {collections?.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.slug}`}
                    onClick={() => setIsCollectionsOpen(false)}
                    className="flex flex-row items-center group p-3 rounded-lg hover:bg-green-50 transition-colors duration-200 space-x-3"
                  >
                    <div className="w-16 h-16 overflow-hidden rounded-lg shadow-sm flex-shrink-0">
                      <img
                        src={
                          collection.featuredAsset?.preview ??
                          '/placeholder.svg'
                        }
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <span className="text-gray-800 text-sm font-medium">
                      {collection.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/about"
            className="text-gray-700 hover:text-[#fb6331] relative group"
          >
            About us
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#fb6331] transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <Link
            to="/contact"
            className="text-gray-700 hover:text-[#fb6331] relative group"
          >
            Contact Us
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#fb6331] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="flex space-x-1 sm:space-x-2 lg:space-x-4 items-center ml-auto">
          {/* Search */}
          <div className="flex items-center space-x-1 sm:space-x-2 relative">
            <div>
              <SearchBar isOpen={isSearchOpen} />
            </div>

            {/* Toggle button */}
            {isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="text-gray-700 p-1.5 sm:p-2 rounded-full transition-colors duration-200"
              >
                <XMarkIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            )}
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
                className="text-gray-700 p-1.5 sm:p-2 rounded-full hover:text-[#fb6331] transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Mobile/Tablet dropdown search bar */}
            {/* {isSearchOpen && (
                <div className="absolute top-full right-3 xl:hidden shadow-md">
                  <SearchBar isOpen={true} />
                </div>
              )} */}
          </div>

          {/* User Profile / Login */}
          {!isSignedIn ? (
            <GoogleLoginButton />
          ) : (
            <Link
              to="/account"
              aria-label="User profile"
              className="text-gray-700 p-1.5 sm:p-2 rounded-full hover:text-[#fb6331] transition-colors duration-200"
            >
              <UserIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </Link>
          )}

          {/* Loyalty Points */}
          {isSignedIn && (
            <div className="p-1 sm:p-1.5 bg-white rounded-full">
              <CoinIcon points={isSignedIn ? loyaltyPoints : 0} />
            </div>
          )}

          {/* Favorites - hidden on small mobile */}
          {isSignedIn && (
            <Link
              to="/favorites"
              aria-label="favorites"
              className="hidden sm:block p-1.5 sm:p-2   text-[#1F0322] hover:text-[#fb6331]"
            >
              <HeartIcon className="w-4 h-4 sm:w-6 sm:h-6 " />
            </Link>
          )}

          {/* Cart Icon */}
          <button
            onClick={isSignedIn ? onCartIconClick : handleShowSignInModal}
            aria-label="Open cart tray"
            className="p-1.5 sm:p-2 rounded-full flex items-center relative text-gray-700 hover:text-[#fb6331] transition-colors duration-200"
          >
            <ShoppingBagIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            {cartQuantity > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#fb6331] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartQuantity}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden mobile-menu-button text-gray-700 p-1.5 sm:p-2 rounded-full hover:text-[#fb6331] transition-colors duration-200"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            ) : (
              <Bars3Icon className="w-4 h-4 sm:w-6 sm:h-6" />
            )}
          </button>
        </div>
      </div>
      <div className="border-b-2 border-[#fbc531] w-full absolute bottom-0 left-0"></div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(100%+0.5rem)] bg-black bg-opacity-50 z-40">
          <div className="mobile-menu bg-white shadow-lg rounded-b-lg mx-2 sm:mx-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <nav className="py-4 px-4 space-y-4">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full text-gray-800 font-medium py-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                Home
              </Link>

              <div className="border-b border-gray-100 pb-2">
                <button
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="flex items-center justify-between w-full text-gray-800 font-medium py-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <span>Shop All</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isMobileProductsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-y-auto  transition-all duration-300 ease-in-out ${
                    isMobileProductsOpen
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 pt-2">
                    {collections?.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/collections/${collection.slug}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileProductsOpen(false);
                        }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 "
                      >
                        <div className="w-10 h-10 overflow-hidden rounded-lg shadow-sm flex-shrink-0">
                          <img
                            src={
                              collection.featuredAsset?.preview ??
                              '/placeholder.svg'
                            }
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">
                          {collection.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full text-gray-800 font-medium py-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                About
              </Link>

              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full text-gray-800 font-medium py-2 hover:bg-gray-100 rounded-md transition-colors duration-200 "
              >
                Contact Us
              </Link>

              {isSignedIn && (
                <div className="sm:hidden space-y-2 pt-2 border-t border-gray-100 mt-4">
                  <Link
                    to="/favorites"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#fb6331] font-medium py-2"
                  >
                    <HeartIcon className="w-5 h-5" />
                    <span>Favorites</span>
                  </Link>

                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#fb6331] font-medium py-2"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Account</span>
                  </Link>
                  <div className="p-1 sm:p-1.5 bg-white rounded-full">
                    <CoinIcon points={loyaltyPoints} />
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
      />
    </header>
  );
}
