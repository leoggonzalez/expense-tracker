"use client";

import "@/components/modal/modal.scss";

import React, { useEffect, useRef } from "react";

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  label: string;
  onClose: () => void;
}

/** Controlled native dialog; feature components supply its content and actions. */
export function Modal({
  children,
  isOpen,
  label,
  onClose,
}: ModalProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes the native dialog element with the controlled isOpen prop.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal__content">{children}</div>
    </dialog>
  );
}
