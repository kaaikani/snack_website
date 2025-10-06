'use client';

import type React from 'react';
import { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface OrderInstructionsProps {
  orderId: string;
  initialValue?: string;
  disabled?: boolean;
}

export function OrderInstructions({
  orderId,
  initialValue = '',
  disabled = false,
}: OrderInstructionsProps) {
  const [instructions, setInstructions] = useState(initialValue);
  const fetcher = useFetcher();

  const handleSave = () => {
    // Only save if there's a change
    if (instructions.trim() === initialValue.trim()) return;

    const formData = new FormData();
    formData.append('action', 'updateOrderInstructions');
    formData.append('orderId', orderId);
    formData.append('instructions', instructions.trim());

    fetcher.submit(formData, { method: 'post' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };
  
  const hasChanges = instructions.trim() !== initialValue.trim();

  return (
    <section className="bg-white mt-5 p-6 rounded-xl shadow-md border border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <PencilSquareIcon className="w-6 h-6 text-amber-600" />
          Special Instructions
        </h2>
        {hasChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={fetcher.state === 'submitting' || disabled}
            className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-200 disabled:opacity-50 transition-colors"
          >
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Add a note for the seller..."
          className="w-full p-3 border border-stone-200 rounded-lg bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none disabled:bg-stone-100 disabled:text-stone-500 transition-colors"
          rows={3}
          maxLength={500}
        />
        <div className="absolute bottom-2 right-3 text-xs text-stone-400">
          {instructions.length}/500
        </div>
      </div>
    </section>
  );
}