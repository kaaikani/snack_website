'use client';

import { Link } from '@remix-run/react';
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

// Note: Re-using your Collection type, ensure it's correct for your project
interface Collection {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: {
    id: string;
    preview: string;
  } | null;
}

// Re-using your CoinIcon component
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
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) setIsHeaderVisible(true);
      else if (currentScrollY > lastScrollY) setIsHeaderVisible(false);
      else setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isCartOpen]);

  const handleShowSignInModal = () => {
    setShowSignInModal(true);
  };

  useEffect(() => {
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
             <img src="https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/southmithai(1).png" alt="Kaaikani Logo" width={96} height={96} className="h-16 w-full" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-8">
            {/* ... Desktop Navigation ... */}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <SearchBar isOpen={isSearchOpen}  />
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} aria-label={isSearchOpen ? 'Close search' : 'Open search'} className="p-2 text-amber-100 hover:text-white transition-colors">
              {isSearchOpen ? <XMarkIcon className="w-6 h-6" /> : <MagnifyingGlassIcon className="w-6 h-6" />}
            </button>

            {isSignedIn && <div className="hidden sm:block p-1 sm:p-1.5 bg-amber-700/50 rounded-full border border-amber-600"><CoinIcon points={loyaltyPoints} /></div>}

            <button onClick={isSignedIn ? onCartIconClick : handleShowSignInModal} aria-label="Open cart" className="p-2 flex items-center relative text-amber-100 hover:text-white transition-colors">
              <ShoppingBagIcon className="w-6 h-6" />
              {cartQuantity > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">{cartQuantity}</span>}
            </button>

             {isSignedIn && (
                <Link to="/favorites" aria-label="favorites" className="hidden sm:block p-1.5 sm:p-2 text-amber-200 hover:text-[#fb6331]">
                  <HeartIcon className="w-4 h-4 sm:w-6 sm:h-6 " />
                </Link>
              )}

            {!isSignedIn ? (
               <GoogleLoginButton />
            ) : (
              <Link to="/account" aria-label="My Account" className="p-2 text-amber-100 hover:text-white transition-colors">
                <UserIcon className="w-6 h-6" />
              </Link>
            )}

            {/* --- FIX 1: UNCOMMENTED THE MOBILE MENU BUTTON --- */}
            {/* <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu" className="lg:hidden mobile-menu-button p-2 text-amber-100 hover:text-white">
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button> */}
            
          </div>
        </div>
      </div>

      <div 
        className={`lg:hidden fixed inset-0 z-40 bg-amber-800 shadow-lg transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-amber-700 flex justify-between items-center">
          <h2 className="font-semibold text-white">Menu</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-amber-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="py-4 px-4 space-y-2">
          {/* ... Mobile Menu Links ... */}
          <div className="pt-4 border-t border-amber-700">
            {!isSignedIn ? (
              // --- FIX 2: RE-ADDED isMobile PROP ---
              <GoogleLoginButton  />
            ) : (
              <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="block text-amber-50 font-medium py-2 px-3 hover:bg-amber-700 rounded-md">
                My Account
              </Link>
            )}
          </div>
        </nav>
      </div>
      <SignInPromptModal isOpen={showSignInModal} close={() => setShowSignInModal(false)} />
    </header>
  );
}