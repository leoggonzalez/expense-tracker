"use client";

import "./verify_login_page.scss";

import { Button, Input, OtpInput, useNavigationProgress } from "@/components";
import { Container } from "@/components/container/container";
import { verifyLoginCode } from "@/actions/auth";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React, { useState } from "react";

type VerifyLoginPageProps = {
  initialEmail: string;
};

export function VerifyLoginPage({
  initialEmail,
}: VerifyLoginPageProps): React.ReactElement {
  const { push, refresh } = useNavigationProgress();
  const email = initialEmail;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await verifyLoginCode({
      email,
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
    <Container>
      <div className="verify-login-page">
        <div className="verify-login-page__card">
          <Box padding={24} maxWidth={480}>
            <form onSubmit={handleSubmit}>
              <Stack gap={16}>
                <Text size="h2" as="h1" weight="bold">
                  {i18n.t("auth.verify_title")}
                </Text>
                <Text color="secondary">
                  {i18n.t("auth.code_sent", { email })}
                </Text>

                <Input
                  label={i18n.t("auth.email")}
                  type="email"
                  value={email}
                  onChange={() => undefined}
                  placeholder={i18n.t("auth.email_placeholder") as string}
                  disabled
                  readOnly
                  required
                />

                <OtpInput
                  label={i18n.t("auth.code_group_label")}
                  value={code}
                  onChange={setCode}
                  required
                />

                {error && <Text color="danger">{i18n.t(error)}</Text>}

                <Button type="submit" disabled={loading} fullWidth>
                  {loading
                    ? i18n.t("auth.verifying_code")
                    : i18n.t("auth.verify_code")}
                </Button>
              </Stack>
            </form>
          </Box>
        </div>
      </div>
    </Container>
  );
}
