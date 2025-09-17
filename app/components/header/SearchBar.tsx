'use client';

import { Form } from '@remix-run/react';
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

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <Form method="get" action="/search" className="w-full">
        <input
          type="text"
          name="q"
          placeholder="Search"
          className={`w-full p-2 shadow-md rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600 transform transition-all duration-300 ease-out ${
            isOpen ? 'translate-x-0 scale-100' : 'translate-x-4 scale-95'
          }`}
          autoFocus={isOpen}
        />
      </Form>
    </div>
  );
}
