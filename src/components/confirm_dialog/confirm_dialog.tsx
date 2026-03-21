"use client";

import "./confirm_dialog.scss";

import { Button } from "@/components/button/button";
import { Box, Stack, Text } from "@/elements";
import React, { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: "danger" | "outline-danger" | "primary" | "secondary";
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "danger",
  isLoading = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDialogProps): React.ReactElement {
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
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="confirm-dialog__content">
        <Box padding={24}>
          <Stack gap={20}>
            <Stack gap={10}>
              <Text as="h3" size="h4" weight="semibold">
                {title}
              </Text>
              <Text size="sm" color="secondary">
                {description}
              </Text>
              {error ? (
                <Text size="sm" color="danger">
                  {error}
                </Text>
              ) : null}
            </Stack>

            <div className="confirm-dialog__actions">
              <Stack
                gap={8}
                fullWidth
                desktopDirection="row"
                justify="flex-end"
              >
                <Button
                  type="button"
                  variant={confirmVariant}
                  onClick={onConfirm}
                  disabled={isLoading}
                  fullWidth="mobile-only"
                >
                  {confirmLabel}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  fullWidth="mobile-only"
                >
                  {cancelLabel}
                </Button>
              </Stack>
            </div>
          </Stack>
        </Box>
      </div>
    </dialog>
  );
}
