'use client';

import { Link, useLoaderData } from '@remix-run/react';
import {
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from './SearchBar';
import { useState, useEffect } from 'react';
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
      className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 
               10 10 10-4.48 10-10S17.52 2 12 2zm0 
               18c-4.41 0-8-3.59-8-8s3.59-8 
               8-8 8 3.59 8 8-3.59 8-8 
               8zm0-12c-2.21 0-4 1.79-4 4s1.79 
               4 4 4 4-1.79 4-4-1.79-4-4
               -4zm0 6c-1.1 0-2-.9-2-2s.9-2 
               2-2 2 .9 2 2-.9 2-2 2z"
      />
    </svg>
    <span className="text-xs sm:text-sm font-medium text-white">
      {points ?? '0'} Points
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

  return (
    <header
      className={`bg-white text-white shadow-lg fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Black Bar Above Navbar */}
      <div className="bg-black h-7"></div>

      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="w-20">
            <Link to="/">
              <span className="text-black font-bold text-2xl">Logo</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-6">
            <Link
              to="/"
              className="text-green-700 hover:text-green-700 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <button className="text-gray-400 hover:text-green-700 flex items-center space-x-1 relative group px-1">
                <div className="relative">
                  <span>Products</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 transition-all duration-300 group-hover:w-full"></span>
                </div>
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </button>

              <div
                className={`absolute top-full left-0 w-[1000px] bg-white shadow-lg rounded-lg py-6 mt-1 transition-all duration-300 ease-in-out transform origin-top-left ${
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
                      <span className="text-gray-800 text-sm font-medium group-hover:text-green-700">
                        {collection.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/about"
              className="text-gray-400 hover:text-green-700 relative group"
            >
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/contact"
              className="text-gray-400 hover:text-green-700 relative group"
            >
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>
        </div>

        {/* Icons */}
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <SearchBar isOpen={isSearchOpen} />
            {isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="bg-green-700 p-2 rounded-full hover:bg-black transition-colors duration-200"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            )}
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
                className="bg-green-700 p-2 rounded-full hover:bg-black transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          <Link
            to="/favorites"
            aria-label="favorites"
            className="bg-green-700 p-2 rounded-full hover:bg-black"
          >
            <HeartIcon className="w-6 h-6 text-white" />
          </Link>

          {/* Loyalty Points */}
          <div className="p-1.5 bg-green-700 rounded-full">
            <CoinIcon points={isSignedIn ? loyaltyPoints : 0} />
          </div>


          <button
            onClick={onCartIconClick}
            aria-label="Open cart tray"
            className="bg-green-700 p-2 px-3 rounded-full hover:bg-black flex items-center space-x-1 relative"
          >
            <ShoppingBagIcon className="w-6 h-6 text-white" />
            <span className="text-white text-sm">Cart</span>
            {cartQuantity > 0 && (
              <span className="bg-white text-green-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartQuantity}
              </span>
            )}
          </button>

           <div className="flex items-center">


                <GoogleLoginButton />


              </div>

          <Link
            to="/account"
            aria-label="User profile"
            className="bg-green-700 p-2 rounded-full hover:bg-black"
          >
            <UserIcon className="w-6 h-6 text-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}
