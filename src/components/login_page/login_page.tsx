"use client";

import "./login_page.scss";

import { Button, Input } from "@/components";
import { Container } from "@/components/container/container";
import { requestLoginCode } from "@/actions/auth";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await requestLoginCode({ email });

    if (!result.success) {
      setError(result.error || "auth.request_failed");
      setLoading(false);
      return;
    }

    router.push(
      `/login/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`,
    );
  };

  return (
    <Container>
      <div className="login-page">
        <Box padding={24} maxWidth={480} className="login-page__card">
          <form onSubmit={handleSubmit}>
            <Stack gap={16}>
              <Text size="h2" as="h1" weight="bold">
                {i18n.t("auth.title")}
              </Text>
              <Text color="secondary">{i18n.t("auth.subtitle")}</Text>

              <Input
                label={i18n.t("auth.email")}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={i18n.t("auth.email_placeholder") as string}
                autoComplete="email"
                required
              />

              {error && <Text color="danger">{i18n.t(error)}</Text>}

              <Button type="submit" disabled={loading} fullWidth>
                {loading
                  ? i18n.t("auth.sending_code")
                  : i18n.t("auth.send_code")}
              </Button>
            </Stack>
          </form>
        </Box>
      </div>
    </Container>
  );
}
