"use client";

import { Button, Input } from "@/components";
import { Container } from "@/components/container/container";
import { logout } from "@/actions/auth";
import { updateCurrentUserProfile } from "@/actions/user";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type AccountPageProps = {
  user: {
    email: string;
    name: string | null;
  };
};

export function AccountPage({
  user,
}: AccountPageProps): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateCurrentUserProfile({ name });

    if (!result.success) {
      setError(result.error || "account.update_failed");
      setLoading(false);
      return;
    }

    setSuccess("account.save_success");
    setLoading(false);
    router.refresh();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Container>
      <Stack gap={24}>
        <Box padding={24} maxWidth={640}>
          <form onSubmit={handleSave}>
            <Stack gap={16}>
              <Text size="h2" as="h1" weight="bold">
                {i18n.t("account.title")}
              </Text>

              <Text weight="semibold">{i18n.t("account.email")}</Text>
              <Text color="secondary">{user.email}</Text>

              <Input
                label={i18n.t("account.name")}
                value={name}
                onChange={setName}
                placeholder={i18n.t("account.name_placeholder") as string}
              />

              {error && <Text color="danger">{i18n.t(error)}</Text>}
              {success && <Text color="success">{i18n.t(success)}</Text>}

              <Stack direction="row" gap={12} wrap>
                <Button type="submit" disabled={loading}>
                  {loading ? i18n.t("account.saving") : i18n.t("account.save")}
                </Button>
                <Button type="button" variant="secondary" onClick={handleLogout}>
                  {i18n.t("account.logout")}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Container>
  );
}
