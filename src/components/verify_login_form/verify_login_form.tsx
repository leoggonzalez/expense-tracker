"use client";

import "./verify_login_form.scss";

import React, { useState } from "react";

import { verifyLoginCode } from "@/actions/auth";
import { Button, Input, OtpInput, useNavigationProgress } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type VerifyLoginFormProps = {
  initialEmail: string;
};

export function VerifyLoginForm({
  initialEmail,
}: VerifyLoginFormProps): React.ReactElement {
  const { push, refresh } = useNavigationProgress();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await verifyLoginCode({
      email: initialEmail,
      code,
    });

    if (!result.success) {
      setError(result.error || "auth.verify_failed");
      setLoading(false);
      return;
    }

    push("/");
    refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="verify-login-form">
      <Stack gap={16}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("auth.verify_title")}
        </Text>
        <Text color="secondary">
          {i18n.t("auth.code_sent", { email: initialEmail })}
        </Text>

        <Input
          label={i18n.t("auth.email")}
          type="email"
          value={initialEmail}
          onChange={() => undefined}
          placeholder={i18n.t("auth.email_placeholder") as string}
          disabled
          readOnly
          required
          fullWidth
        />

        <OtpInput
          label={i18n.t("auth.code_group_label")}
          value={code}
          onChange={setCode}
          required
        />

        {error ? <Text color="danger">{i18n.t(error)}</Text> : null}

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? i18n.t("auth.verifying_code") : i18n.t("auth.verify_code")}
        </Button>
      </Stack>
    </form>
  );
}
