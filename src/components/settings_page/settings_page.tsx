"use client";

import "./settings_page.scss";

import { Button, Container, Input } from "@/components";
import { logout } from "@/actions/auth";
import { updateCurrentUserProfile } from "@/actions/user";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type SettingsPageProps = {
  user: {
    email: string;
    name: string | null;
  };
};

export function SettingsPage({ user }: SettingsPageProps): React.ReactElement {
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
      setError(result.error || "settings_page.update_failed");
      setLoading(false);
      return;
    }

    setSuccess("settings_page.save_success");
    setLoading(false);
    router.refresh();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Container>
      <Stack gap={20}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("settings_page.title")}
        </Text>

        <Box padding={20} className="settings-page__panel">
          <form onSubmit={handleSave}>
            <Stack gap={16}>
              <div className="settings-page__field">
                <Text size="sm" weight="semibold">
                  {i18n.t("settings_page.email")}
                </Text>
                <Text color="secondary">{user.email}</Text>
              </div>

              <Input
                label={i18n.t("settings_page.name")}
                value={name}
                onChange={setName}
                placeholder={i18n.t("settings_page.name_placeholder") as string}
              />

              {error && <Text color="danger">{i18n.t(error)}</Text>}
              {success && <Text color="success">{i18n.t(success)}</Text>}

              <Stack
                direction="column"
                gap={12}
                className="settings-page__actions"
              >
                <Button type="submit" disabled={loading} fullWidth>
                  {loading
                    ? i18n.t("settings_page.saving")
                    : i18n.t("settings_page.save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLogout}
                  fullWidth
                >
                  {i18n.t("settings_page.logout")}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Container>
  );
}
