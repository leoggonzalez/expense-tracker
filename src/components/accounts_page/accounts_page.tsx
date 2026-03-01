"use client";

import "./accounts_page.scss";

import { Button, Container, Input } from "@/components";
import { createAccount } from "@/actions/accounts";
import { Grid, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { AccountCard } from "@/components/account_card/account_card";

type AccountsPageProps = {
  accounts: Array<{
    id: string;
    name: string;
    entryCount: number;
    allTimeNet: number;
  }>;
};

export function AccountsPage({
  accounts,
}: AccountsPageProps): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createAccount({ name });

    if (!result.success) {
      setError(result.error || "accounts_page.create_failed");
      setLoading(false);
      return;
    }

    setName("");
    setLoading(false);
    router.refresh();
  };

  return (
    <Container>
      <Stack gap={20}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("accounts_page.title")}
        </Text>

        <form onSubmit={handleSubmit} className="accounts-page__create-form">
          <Stack gap={12}>
            <Text size="sm" weight="semibold">
              {i18n.t("accounts_page.create_account")}
            </Text>
            <div className="accounts-page__create-row">
              <Input
                label={i18n.t("accounts_page.account_name")}
                value={name}
                onChange={setName}
                placeholder={
                  i18n.t("accounts_page.account_name_placeholder") as string
                }
                required
              />
              <Button type="submit" disabled={loading}>
                {loading
                  ? i18n.t("accounts_page.creating")
                  : i18n.t("accounts_page.create")}
              </Button>
            </div>
            {error && <Text color="danger">{i18n.t(error)}</Text>}
          </Stack>
        </form>

        {accounts.length === 0 ? (
          <div className="accounts-page__empty">
            <Text color="secondary">{i18n.t("accounts_page.empty_state")}</Text>
          </div>
        ) : (
          <Grid className="accounts-page__grid" minColumnWidth={240} gap={16}>
            {accounts.map((account) => (
              <AccountCard key={account.id} {...account} />
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
