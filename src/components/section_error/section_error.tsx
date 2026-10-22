"use client";

import React from "react";

import { Button } from "@/components/button/button";
import { Stack, Text } from "@/elements";

interface SectionErrorProps {
  message: React.ReactNode;
  tone?: "default" | "inverse";
  retryLabel: React.ReactNode;
  onRetry: () => void;
}

/** Presentation only: the owning controller decides when and how to retry. */
export function SectionError({
  message,
  tone = "default",
  retryLabel,
  onRetry,
}: SectionErrorProps): React.ReactElement {
  return (
    <Stack gap={12} align="start">
      <Text
        element="p"
        type={tone === "inverse" ? "caption" : "body"}
        color={tone === "inverse" ? "hero-muted" : "secondary"}
      >
        {message}
      </Text>
      <Button
        variant={tone === "inverse" ? "outline" : "secondary"}
        size="sm"
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
    </Stack>
  );
}
