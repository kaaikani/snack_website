import React from 'react';
import { Link } from '@remix-run/react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { GoogleLoginButton } from '../Google/GoogleLoginButton';

export default function Footer({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <footer className="relative overflow-hidden">
      <div className="relative bg-white min-h-[200px]">
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="blueGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <path
              d="M 0,15 L 0,100 L 100,100 L 100,15 Q 75,25 50,25 Q 25,25 0,15 Z"
              fill="url(#blueGradient)"
            />
          </svg>
        </div>

        <div className="relative max-w-3xl mx-auto mt-5 text-center px-6 py-8">
          {/* Main CTA Card */}
          <div className="bg-gradient-to-r from-yellow-300 to-orange-300 rounded-3xl mb-7 relative overflow-hidden">
            <div className="flex items-center gap-8">
              <div className="w-1/3 rounded-full">
                <img
                  src="/Apple.jpg"
                  alt="Cube Logo"
                  className="w-full h-auto object-cover rounded-r-2xl"
                />
              </div>
              <div className="w-2/3 text-center">
                <h2 className="text-3xl font-bold text-blue-900 mb-2">
                  NEVER MISS A DROP
                </h2>
                <p
                  className="text-blue-800 mb-4
                 text-sm"
                >
                  Looking for a trusted wholesale snack supplier? We specialize
                  in providing a wide variety of snacks – from traditional
                  favorites to modern healthy choices
                </p>
                <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-full">
                  CONTACT US
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-5">
            {!isSignedIn && <GoogleLoginButton />}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center justify-center gap-8 text-white">
            <Link
              to="/about"
              className="hover:text-yellow-300 transition-colors font-medium"
            >
              HOME
            </Link>
            <Link
              to="/products"
              className="hover:text-yellow-300 transition-colors font-medium"
            >
              PRODUCTS
            </Link>
            <Link
              to="/contact"
              className="hover:text-yellow-300 transition-colors font-medium"
            >
              ABOUT US
            </Link>
            <Link
              to="/faq"
              className="hover:text-yellow-300 transition-colors font-medium"
            >
              CONTACT US
            </Link>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex relative items-center mx-auto mt-7 text-center max-w-4xl justify-between text-sm text-blue-200 border-t border-blue-600 py-6">
          <div className="flex items-center gap-4">
            <span>
              Copyright | 2023 SPARKS (S) PTE LTD. All Rights Reserved.
            </span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms and Conditions
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Facebook className="w-4 h-4 text-black" />
            </div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Instagram className="w-4 h-4 text-black" />
            </div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Twitter className="w-4 h-4 text-black" />
            </div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Linkedin className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
