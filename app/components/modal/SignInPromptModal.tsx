import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { Fragment, PropsWithChildren } from 'react';
import { Link } from '@remix-run/react';
import { ModalProvider, useModal } from './modal-context';

type SignInPromptModalProps = {
  isOpen: boolean;
  close: () => void;
  size?: 'small' | 'medium' | 'large';
  afterClose?: () => void;
  afterOpen?: () => void;
};

export const SignInPromptModal: React.FC<
  PropsWithChildren<SignInPromptModalProps>
> = ({ isOpen, close, size = 'small', children, afterClose, afterOpen }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={close}>
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
          <div className="fixed inset-0 bg-gray-700 bg-opacity-75 backdrop-blur-sm" />
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
              <Dialog.Panel
                className={clsx(
                  'flex flex-col justify-start w-full h-full overflow-auto transform bg-white p-10 text-left align-middle shadow-xl transition-all',
                  {
                    'max-w-md': size === 'small',
                    'max-w-xl': size === 'medium',
                    'max-w-3xl': size === 'large',
                  },
                )}
              >
                <ModalProvider close={close}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Sign In Required
                    </h3>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={close}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You need to be signed in to add items to your cart or view
                      your cart.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <Link
                      to="/"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                      onClick={close}
                    >
                      ok
                    </Link>
                  </div>
                </ModalProvider>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
