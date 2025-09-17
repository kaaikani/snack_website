'use client';

import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ToastNotification({
  show,
  type,
  title,
  message,
  onClose,
  autoDismiss = true,
  dismissDuration = 5000,
}: {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  autoDismiss?: boolean;
  dismissDuration?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;
  const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400';
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'ring-green-200' : 'ring-red-200';

  // Auto-dismiss the toast after specified duration
  useEffect(() => {
    if (show && autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, dismissDuration);

      return () => clearTimeout(timer);
    }
  }, [show, autoDismiss, dismissDuration, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <Transition
      show={show}
      appear
      enter="transition ease-out duration-300"
      enterFrom="opacity-0 translate-y-1/2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1/2"
    >
      <div
        role="alert"
        aria-live="assertive"
        className={`fixed top-4 right-4 z-[100000] pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg ${bgColor} shadow-lg ring-1 ${borderColor} ring-opacity-5`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon aria-hidden="true" className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500 break-words whitespace-pre-line">
                {message}
              </p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>,
    document.body,
  );
}
