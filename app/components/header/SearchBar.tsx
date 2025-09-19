'use client';

import type React from 'react';

import { useState, useEffect } from 'react';

export function SearchBar({ isOpen }: { isOpen: boolean }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('q') as string;
    if (query?.trim()) {
      console.log('Searching for:', query);
      // You can implement search navigation here
      // router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'w-32 sm:w-48 md:w-56 lg:w-64 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="text"
          name="q"
          placeholder="Search"
          className={`w-full p-1 sm:p-1.5 md:p-2 shadow-md rounded-full border border-gray-300 text-black text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#6F00FF] transform transition-all duration-300 ease-out ${
            isOpen ? 'translate-x-0 scale-100' : 'translate-x-4 scale-95'
          }`}
          autoFocus={isOpen}
        />
      </form>
    </div>
  );
}
