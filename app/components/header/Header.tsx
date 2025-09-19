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
      className={`bg-[#1F0322] text-white shadow-lg fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Black Bar Above Navbar */}
      <div className="bg-[#6F00FF] h-7"></div>

      <div className="mx-2 sm:mx-4 lg:mx-10 p-2 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8">
          {/* Logo */}
          <div className="w-16 sm:w-20">
            <Link to="/">
              <span className="text-white font-bold text-xl sm:text-2xl">
                Snacks
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6">
            <Link to="/" className="text-white hover:text-white relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <button className="text-gray-400 hover:text-white flex items-center space-x-1 relative group px-1">
                <div className="relative">
                  <span>Products</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </div>
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </button>

              <div
                className={`absolute top-[50px] left-[-5] w-[1000px] bg-white shadow-lg rounded-lg py-6 mt-1 transition-all duration-300 ease-in-out transform origin-top-left ${
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
                      <span className="text-gray-800 text-sm font-medium group-hover:text-white">
                        {collection.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/about"
              className="text-gray-400 hover:text-white relative group"
            >
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/contact"
              className="text-gray-400 hover:text-white relative group"
            >
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>
        </div>

        <div className="flex space-x-1 sm:space-x-2 lg:space-x-4 items-center">
          {/* Search */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <SearchBar isOpen={isSearchOpen} />
            {isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="bg-white text-[#1F0322] p-1.5 sm:p-2 rounded-full  transition-colors duration-200"
              >
                <XMarkIcon className="w-4 h-4 sm:w-6 sm:h-6 text-[#1F0322]" />
              </button>
            )}
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
                className="bg-white text-[#1F0322] p-1.5 sm:p-2 rounded-full hover:bg-black hover:text-white transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-6 sm:h-6 " />
              </button>
            )}
          </div>

          {/* Favorites - hidden on small mobile */}
          <Link
            to="/favorites"
            aria-label="favorites"
            className="hidden sm:block bg-white p-1.5 sm:p-2 rounded-full hover:bg-black text-[#1F0322] hover:text-white"
          >
            <HeartIcon className="w-4 h-4 sm:w-6 sm:h-6 " />
          </Link>

          {/* Loyalty Points */}
          <div className="p-1 sm:p-1.5 bg-white rounded-full">
            <CoinIcon points={isSignedIn ? loyaltyPoints : 0} />
          </div>

          {/* Cart */}
          <button
            onClick={onCartIconClick}
            aria-label="Open cart tray"
            className="bg-white p-1.5 sm:p-2 px-2 sm:px-3 rounded-full  flex items-center space-x-1 relative"
          >
            <ShoppingBagIcon className="w-4 h-4 sm:w-6 sm:h-6 text-[#1F0322]" />
            <span className=" text-[#1F0322] text-xs sm:text-sm hidden sm:inline">
              Cart
            </span>
            {cartQuantity > 0 && (
              <span className="bg-white text-[#1F0322] text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0">
                {cartQuantity}
              </span>
            )}
          </button>

          {/* User Profile - hidden on small mobile */}
          <Link
            to="/account"
            aria-label="User profile"
            className="hidden sm:block bg-white p-1.5 sm:p-2 rounded-full hover:bg-black"
          >
            <UserIcon className="w-4 h-4 sm:w-6 sm:h-6 text-[#1F0322] hover:text-white" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden mobile-menu-button bg-white p-1.5 sm:p-2 rounded-full hover:bg-black transition-colors duration-200"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-4 h-4 sm:w-6 sm:h-6 text-[#1F0322] hover:text-white" />
            ) : (
              <Bars3Icon className="w-4 h-4 sm:w-6 sm:h-6 text-[#1F0322] hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(100%+0.5rem)] bg-black bg-opacity-50 z-40">
          <div className="mobile-menu bg-white shadow-lg rounded-b-lg mx-2 sm:mx-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <nav className="py-4 px-4 space-y-4">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-white hover:text-green-800 font-medium py-2 border-b border-gray-100"
              >
                Home
              </Link>

              <div className="border-b border-gray-100">
                <button
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="flex items-center justify-between w-full text-gray-800 font-medium py-2 mb-2 hover:text-white transition-colors duration-200"
                >
                  <span>Products</span>
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
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
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
                className="block text-gray-700 hover:text-white font-medium py-2 border-b border-gray-100"
              >
                About Us
              </Link>

              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-white font-medium py-2 border-b border-gray-100"
              >
                Contact Us
              </Link>

              <div className="sm:hidden space-y-2 pt-2">
                <Link
                  to="/favorites"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-white font-medium py-2"
                >
                  {/* <HeartIcon className="w-5 h-5" /> */}
                  <span>Favorites</span>
                </Link>

                <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-white font-medium py-2"
                >
                  {/* <UserIcon className="w-5 h-5" /> */}
                  <span>Account</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
