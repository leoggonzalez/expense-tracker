"use client";

import React, { useState } from "react";

import { logout } from "@/actions/auth";
import { updateCurrentUserProfile } from "@/actions/user";
import { Button, Input } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";

type AccountProfileFormProps = {
  user: {
    email: string;
    name: string | null;
  };
};

export function AccountProfileForm({
  user,
}: AccountProfileFormProps): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (event: React.FormEvent): Promise<void> => {
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

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  return (
    <Card padding={24}>
      <form onSubmit={handleSave}>
        <Stack gap={20}>
          <Card padding={20} variant="secondary">
            <Stack gap={4}>
              <Text size="sm" weight="semibold">
                {i18n.t("account.email")}
              </Text>
              <Text color="secondary">{user.email}</Text>
            </Stack>
          </Card>

          <Input
            label={i18n.t("account.name")}
            value={name}
            onChange={setName}
            placeholder={i18n.t("account.name_placeholder") as string}
          />

          {error ? <Text color="danger">{i18n.t(error)}</Text> : null}
          {success ? <Text color="success">{i18n.t(success)}</Text> : null}

          <Stack gap={12}>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? i18n.t("account.saving") : i18n.t("account.save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
              fullWidth
            >
              {i18n.t("account.logout")}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  );
}
