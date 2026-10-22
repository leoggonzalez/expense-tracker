"use client";

import { Button } from "@/components/button/button";
import { Modal } from "@/components/modal/modal";
import { Box, Stack, Text } from "@/elements";
import React from "react";

interface ConfirmDialogProps {
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
}

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
  return (
    <Modal isOpen={isOpen} label={title} onClose={onClose}>
      <Box padding={24}>
        <Stack gap={20}>
          <Stack gap={10}>
            <Text element="h3" type="h4-semibold">
              {title}
            </Text>
            <Text element="p" type="caption" color="secondary">
              {description}
            </Text>
            {error ? (
              <Text element="p" type="caption" color="danger">
                {error}
              </Text>
            ) : null}
          </Stack>

          <Stack gap={8} fullWidth lineDesktop justify="end">
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
        </Stack>
      </Box>
    </Modal>
  );
}
