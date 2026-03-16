"use client";

import "./account_page.scss";

import { Button, Hero, Input } from "@/components";
import { logout } from "@/actions/auth";
import { updateCurrentUserProfile } from "@/actions/user";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type AccountPageProps = {
  user: {
    email: string;
    name: string | null;
  };
};

export function AccountPage({ user }: AccountPageProps): React.ReactElement {
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
    <div className="account-page">
      <Stack gap={24}>
        <Hero icon="accounts" title={String(i18n.t("account.title"))} pattern="account">
          <div className="account-page__hero-body">
            <Text as="p" size="sm" color="inverse">
              {i18n.t("account.subtitle")}
            </Text>
            <div className="account-page__hero-summary">
              <div className="account-page__hero-stat">
                <Text size="sm" color="inverse">
                  {i18n.t("account.email")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {user.email}
                </Text>
              </div>
              <div className="account-page__hero-stat">
                <Text size="sm" color="inverse">
                  {i18n.t("account.name")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {user.name || i18n.t("navigation.user_fallback_name")}
                </Text>
              </div>
            </div>
          </div>
        </Hero>

        <div className="account-page__panel">
          <Card padding={24}>
            <form onSubmit={handleSave}>
              <Stack gap={20}>
                <div className="account-page__field">
                  <Stack gap={4}>
                    <Text size="sm" weight="semibold">
                      {i18n.t("account.email")}
                    </Text>
                    <Text color="secondary">{user.email}</Text>
                  </Stack>
                </div>

                <Input
                  label={i18n.t("account.name")}
                  value={name}
                  onChange={setName}
                  placeholder={i18n.t("account.name_placeholder") as string}
                />

                {error ? <Text color="danger">{i18n.t(error)}</Text> : null}
                {success ? <Text color="success">{i18n.t(success)}</Text> : null}

                <div className="account-page__actions">
                  <Stack gap={12}>
                    <Button type="submit" disabled={loading} fullWidth>
                      {loading
                        ? i18n.t("account.saving")
                        : i18n.t("account.save")}
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
                </div>
              </Stack>
            </form>
          </Card>
        </div>
      </Stack>
    </div>
  );
}
