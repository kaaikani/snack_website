'use client';

import { Link, useLocation } from '@remix-run/react';
import {
  ShoppingBagIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from './SearchBar';
import { useState, useEffect } from 'react';
import { SignInPromptModal } from '~/components/modal/SignInPromptModal';
import { GoogleLoginButton } from '../Google/GoogleLoginButton';

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
      className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
    <span className="text-xs font-medium text-amber-100 hidden sm:inline">
      {points ?? '0'} Points
    </span>
    <span className="text-sm font-sm text-amber-100 sm:hidden">
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
  alwaysVisible = false,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
  collections: Collection[];
  isCartOpen: boolean;
  loyaltyPoints: number | null;
  isSignedIn: boolean;
  alwaysVisible?: boolean;
}) {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Determine if we're on an account page
  const isAccountPage = location.pathname.startsWith('/account');

  useEffect(() => {
    const handleScroll = () => {
      if (isCartOpen || isAccountPage) {
        setIsHeaderVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) setIsHeaderVisible(true);
      else if (currentScrollY > lastScrollY)
        setIsHeaderVisible(false); // scrolling down
      else setIsHeaderVisible(true); // scrolling up

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isCartOpen, isAccountPage]);

  const handleShowSignInModal = () => setShowSignInModal(true);

  // Mobile menu overlay
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-20 bg-amber-800 border-b border-amber-700/50 shadow-md transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-semibold text-white">
              <img
                src="https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/southmithai(1).png"
                alt="Kaaikani Logo"
                width={96}
                height={96}
                className="h-16 w-full"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-8">
         <Link
             to="/"
             className="text-amber-100 hover:text-white text-sm font-medium transition-colors"
            >
             Home
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <button className="text-amber-100 hover:text-white flex items-center text-sm font-medium transition-colors">
                Shop All
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </button>
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 w-[900px] bg-white shadow-lg rounded-lg p-6 mt-4 transition-all duration-300 ease-in-out transform origin-top ${
                  isCollectionsOpen
                    ? 'opacity-100 translate-y-0 visible'
                    : 'opacity-0 -translate-y-2 invisible'
                }`}
              >
                <div className="grid grid-cols-4 gap-6">
                  {collections?.map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.slug}`}
                      onClick={() => setIsCollectionsOpen(false)}
                      className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-amber-50"
                    >
                      <div className="w-14 h-14 overflow-hidden rounded-md flex-shrink-0">
                        <img
                          src={
                            collection.featuredAsset?.preview ??
                            '/placeholder.svg'
                          }
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <span className="text-stone-700 text-sm font-medium group-hover:text-amber-700">
                        {collection.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/about"
              className="text-amber-100 hover:text-white text-sm font-medium transition-colors"
            >
              About us
            </Link>
          </nav>

          {/* Icons & Mobile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <SearchBar isOpen={isSearchOpen} />
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              className="p-2 text-amber-100 hover:text-white transition-colors"
            >
              {isSearchOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <MagnifyingGlassIcon className="w-6 h-6" />
              )}
            </button>

            {isSignedIn && (
              <div className="hidden sm:block p-1 sm:p-1.5 bg-amber-700/50 rounded-full border border-amber-600">
                <CoinIcon points={loyaltyPoints} />
              </div>
            )}

            <button
              onClick={isSignedIn ? onCartIconClick : handleShowSignInModal}
              aria-label="Open cart"
              className="p-2 flex items-center relative text-amber-100 hover:text-white transition-colors"
            >
              <ShoppingBagIcon className="w-6 h-6" />
              {cartQuantity > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartQuantity}
                </span>
              )}
            </button>

            {isSignedIn && (
              <Link
                to="/favorites"
                aria-label="favorites"
                className="hidden sm:block p-1.5 sm:p-2 text-amber-200 hover:text-[#fb6331]"
              >
                <HeartIcon className="w-4 h-4 sm:w-6 sm:h-6 " />
              </Link>
            )}

            {!isSignedIn ? (
              <GoogleLoginButton />
            ) : (
              <Link
                to="/account"
                aria-label="My Account"
                className="p-2 text-amber-100 hover:text-white transition-colors"
              >
                <UserIcon className="w-6 h-6" />
              </Link>
            )}

            {/* <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="lg:hidden mobile-menu-button p-2 text-amber-100 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button> */}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* <div
          className={`mobile-menu absolute top-0 right-0 h-full w-4/5 max-w-sm bg-amber-800 shadow-lg transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div>
          <div className="p-4 border-b border-amber-700 flex justify-between items-center">
            <h2 className="font-semibold text-white">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-amber-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="py-4 px-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
            >
              Home
            </Link>
            <div className="border-b border-amber-700 pb-2">
              <button
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className="flex items-center justify-between w-full text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
              >
                <span>Shop All</span>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform ${
                    isMobileProductsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isMobileProductsOpen ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="grid grid-cols-1 gap-2 pl-6 pt-2">
                  {collections?.map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-amber-700"
                    >
                      <img
                        src={collection.featuredAsset?.preview ?? '/placeholder.svg'}
                        alt={collection.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="text-amber-100 text-sm">
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
              className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
            >
              Contact Us
            </Link>

            <div className="pt-4 border-t border-amber-700">
              {!isSignedIn ? (
                <Link
                  to="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
                >
                  Sign In
                </Link>
              ) : (
                <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md"
                >
                  My Account
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div> */}

      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
      />
    </header>
  );
}
