"use client";

import "./login_form.scss";

import React, { useState } from "react";

import { requestLoginCode } from "@/actions/auth";
import { Button, Input, useNavigationProgress } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export function LoginForm(): React.ReactElement {
  const { push } = useNavigationProgress();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await requestLoginCode({ email });

    if (!result.success) {
      setError(result.error || "auth.request_failed");
      setLoading(false);
      return;
    }

    push(
      `/login/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
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
          fullWidth
        />

        {error ? <Text color="danger">{i18n.t(error)}</Text> : null}

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? i18n.t("auth.sending_code") : i18n.t("auth.send_code")}
        </Button>
      </Stack>
    </form>
  );
}
