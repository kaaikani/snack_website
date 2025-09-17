'use client';

import type React from 'react';

import { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

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
  const [isSaving, setIsSaving] = useState(false);
  const fetcher = useFetcher();
  const { t } = useTranslation();

  const handleSave = async () => {
    if (instructions.trim() === initialValue.trim()) return;

    setIsSaving(true);

    const formData = new FormData();
    formData.append('action', 'updateOrderInstructions');
    formData.append('orderId', orderId);
    formData.append('instructions', instructions.trim());

    fetcher.submit(formData, { method: 'post' });

    // Reset saving state after a delay
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Special Instructions
        </h3>
        {instructions.trim() !== initialValue.trim() && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || disabled}
            className="text-xs bg-black text-white px-2 py-1 rounded hover:black disabled:opacity-50"
          >
            {isSaving ? t('common.saving') : t('common.save')}
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
          placeholder=""
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
          rows={3}
          maxLength={500}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {instructions.length}/500
        </div>
      </div>

      {/* {fetcher.data?.success && <div className="mt-2 text-xs text-green-600">{t("checkout.instructionsSaved")}</div>}

      {fetcher.data?.error && <div className="mt-2 text-xs text-red-600">{fetcher.data.error}</div>} */}
    </div>
  );
}
