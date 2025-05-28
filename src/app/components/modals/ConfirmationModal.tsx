// src/components/dialogs/ConfirmationDialog.tsx
'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Default icon for warning/delete

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'red' | 'blue' | 'gray'; // Simplified color options for confirm button
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonColor = 'red', // Default to red for destructive actions
}: ConfirmationDialogProps) {

  const confirmButtonBaseStyle = "inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const colorStyles = {
    red: `bg-red-600 hover:bg-red-700 focus-visible:ring-red-500`,
    blue: `bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500`,
    gray: `bg-gray-500 hover:bg-gray-600 focus-visible:ring-gray-500`,
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        {/* Modal content */}
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                >
                  <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-500" aria-hidden="true" />
                  {title}
                </Dialog.Title>
                <div className="mt-3">
                  {typeof message === 'string' ? (
                    <p className="text-sm text-gray-600">{message}</p>
                  ) : (
                    message
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    {cancelButtonText}
                  </button>
                  <button
                    type="button"
                    className={`${confirmButtonBaseStyle} ${colorStyles[confirmButtonColor]}`}
                    onClick={() => {
                      onConfirm();
                      // Optionally, the modal could close itself after onConfirm,
                      // or let the parent component control closing via the isOpen prop.
                      // For simplicity here, parent will handle closing.
                    }}
                  >
                    {confirmButtonText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}