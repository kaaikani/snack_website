import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { Fragment, PropsWithChildren } from 'react';
import { Link } from '@remix-run/react';

type SignInPromptModalProps = {
  isOpen: boolean;
  close: () => void;
  size?: 'small' | 'medium' | 'large';
  afterClose?: () => void;
  afterOpen?: () => void;
};

export const SignInPromptModal: React.FC<
  PropsWithChildren<SignInPromptModalProps>
> = ({ isOpen, close, size = 'small', afterClose, afterOpen }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={close}>
        {/* The overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterEnter={afterOpen}
          afterLeave={afterClose}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* --- THE FIX IS HERE: Styling is applied directly to Dialog.Panel --- */}
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden rounded-xl bg-stone-50 p-6 text-left align-middle shadow-xl transition-all',
                  {
                    'max-w-md': size === 'small',
                    'max-w-xl': size === 'medium',
                    'max-w-3xl': size === 'large',
                  },
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-stone-800"
                  >
                    Sign In Required
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-stone-400 hover:text-amber-600 transition-colors"
                    onClick={close}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-base text-stone-600">
                    You need to be signed in to add items to your cart or view
                    your cart.
                  </p>
                </div>

                <div className="mt-6">
                  <Link
                    to="/" // Or link to your sign-in page: to="/sign-in"
                    className="inline-flex justify-center w-full rounded-lg shadow-sm px-4 py-2 bg-amber-500 text-base font-semibold text-black hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:text-sm transition-colors"
                    onClick={close}
                  >
                    OK
                  </Link>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};