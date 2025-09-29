'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';

export function SearchBar({ isOpen }: { isOpen: boolean }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('q') as string;
    if (query?.trim()) {
      console.log('Searching for:', query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isOpen
          ? 'w-24 xs:w-28 sm:w-40 md:w-52 lg:w-64 xl:w-72 opacity-100'
          : 'w-0 opacity-0'
      }`}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="text"
          name="q"
          placeholder="Search"
          className={`w-full p-1 xs:p-1.5 sm:p-2 shadow-md rounded-full border border-gray-300 text-black text-xs xs:text-sm sm:text-base md:text-base focus:outline-none focus:ring-2 focus:ring-[#6F00FF] transform transition-all duration-300 ease-out ${
            isOpen ? 'translate-x-0 scale-100' : 'translate-x-4 scale-95'
          }`}
          autoFocus={isOpen}
        />
      </form>
    </div>
  );
}
