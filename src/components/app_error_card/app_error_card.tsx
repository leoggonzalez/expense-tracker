"use client";

import "./app_error_card.scss";

import { Box, Card, Stack, Text } from "@/elements";

import { Button } from "@/components/button/button";
import { Container } from "@/components/container/container";
import { ErrorDetailsPanel } from "@/components/error_details_panel/error_details_panel";
import React from "react";
import { i18n } from "@/model/i18n";

type AppErrorCardProps = {
  error: Error & { digest?: string };
};

type ErrorPayload = {
  digest?: string;
  message?: string;
  name?: string;
  stack?: string;
};

function buildErrorPayload(error: Error & { digest?: string }): string {
  const payload: ErrorPayload = {
    name: error.name,
    message: error.message,
  };

  if (error.digest) {
    payload.digest = error.digest;
  }

  if (error.stack) {
    payload.stack = error.stack;
  }

  return JSON.stringify(payload, null, 2);
}

function reloadApp(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname === "/") {
    window.location.reload();
    return;
  }

  window.location.assign("/");
}

export function AppErrorCard({ error }: AppErrorCardProps): React.ReactElement {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const errorDetails = buildErrorPayload(error);

  return (
    <div className="app-error-card">
      <Container>
        <Stack align="center">
          <Box maxWidth={500}>
            <Card padding={32} radius={28}>
              <Stack gap={20}>
                <Stack gap={8}>
                  <Text as="h1" size="h2" weight="bold">
                    {i18n.t("app_error.title")}
                  </Text>
                  <Text color="secondary">
                    {i18n.t("app_error.description")}
                  </Text>
                </Stack>

                <Button onClick={reloadApp} fullWidth>
                  {i18n.t("app_error.reload")}
                </Button>

                {isDevelopment ? (
                  <ErrorDetailsPanel
                    label={String(i18n.t("app_error.technical_details"))}
                    content={errorDetails}
                  />
                ) : null}
              </Stack>
            </Card>
          </Box>
        </Stack>
      </Container>
    </div>
  );
}
