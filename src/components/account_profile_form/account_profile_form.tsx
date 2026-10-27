"use client";

import { Button, Input } from "@/components";
import { Stack, Text } from "@/elements";
import React, { useState } from "react";

import { logout } from "@/actions/auth";
import { updateCurrentUserAccountProfile } from "@/actions/user_account";
import { i18n } from "@/model/i18n";
import { clearCategoryMatchCache } from "@/lib/category_match_cache";

interface AccountProfileFormProps {
  userAccount: {
    email: string;
    name: string | null;
  };
}

export function AccountProfileForm({
  userAccount,
}: AccountProfileFormProps): React.ReactElement {
  const [name, setName] = useState(userAccount.name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateCurrentUserAccountProfile({ name });

    if (!result.success) {
      setError(result.error || "account.update_failed");
      setLoading(false);
      return;
    }

    setSuccess("account.save_success");
    setLoading(false);
  };

  const handleLogout = async (): Promise<void> => {
    clearCategoryMatchCache();
    await logout();
  };

  return (
    <form onSubmit={handleSave}>
      <Stack gap={20}>
        <Stack gap={4}>
          <Text element="p" type="caption-semibold">
            {i18n.t("account.email")}
          </Text>
          <Text element="p" color="secondary">
            {userAccount.email}
          </Text>
        </Stack>

        <Input
          label={i18n.t("account.name")}
          value={name}
          onChange={setName}
          placeholder={i18n.t("account.name_placeholder") as string}
        />

        {error ? (
          <Text element="p" color="danger">
            {i18n.t(error)}
          </Text>
        ) : null}
        {success ? (
          <Text element="p" color="success">
            {i18n.t(success)}
          </Text>
        ) : null}

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
  );
}
