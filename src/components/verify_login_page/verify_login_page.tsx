"use client";

import { Button, Input } from "@/components";
import { Container } from "@/components/container/container";
import { verifyLoginCode } from "@/actions/auth";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type VerifyLoginPageProps = {
  initialEmail: string;
};

export function VerifyLoginPage({
  initialEmail,
}: VerifyLoginPageProps): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
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

    router.push("/");
    router.refresh();
  };

  return (
    <Container>
      <Stack gap={24}>
        <Box padding={24} maxWidth={480} className="verify-login-page">
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
                value={email}
                onChange={setEmail}
                placeholder={i18n.t("auth.email_placeholder") as string}
                required
              />

              <Input
                label={i18n.t("auth.code")}
                value={code}
                onChange={(value) =>
                  setCode(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={i18n.t("auth.code_placeholder") as string}
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
      </Stack>
    </Container>
  );
}
