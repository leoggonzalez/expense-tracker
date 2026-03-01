"use client";

import "./account_detail_page.scss";

import { Button, Container, EntryList, Input } from "@/components";
import { deleteAccount, updateAccount } from "@/actions/accounts";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type AccountDetailPageProps = {
  account: {
    id: string;
    name: string;
    entryCount: number;
    allTimeNet: number;
    entries: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
      beginDate: string;
      endDate: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  };
};

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  return `${sign}${absAmount.toFixed(2)} €`;
}

export function AccountDetailPage({
  account,
}: AccountDetailPageProps): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const entries = account.entries.map((entry) => ({
    ...entry,
    accountName: account.name,
  }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateAccount(account.id, { name });

    if (!result.success) {
      setError(result.error || "account_detail_page.update_failed");
      setLoading(false);
      return;
    }

    setSuccess("account_detail_page.update_success");
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(i18n.t("account_detail_page.delete_confirm") as string)) {
      return;
    }

    setDeleting(true);
    setError(null);

    const result = await deleteAccount(account.id);

    if (!result.success) {
      setError(result.error || "account_detail_page.delete_failed");
      setDeleting(false);
      return;
    }

    router.push("/accounts");
    router.refresh();
  };

  return (
    <Container>
      <Stack gap={20}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("account_detail_page.title")}
        </Text>

        <Box padding={20} className="account-detail-page__summary">
          <Stack gap={10}>
            <Text size="lg" weight="semibold">
              {account.name}
            </Text>
            <Text size="sm" color="secondary">
              {i18n.t("account_detail_page.total_balance")}
            </Text>
            <Text
              size="h4"
              weight="bold"
              color={account.allTimeNet >= 0 ? "success" : "danger"}
            >
              {formatCurrency(account.allTimeNet)}
            </Text>
            <Text size="sm" color="secondary">
              {i18n.t("accounts_page.entry_count", {
                count: account.entryCount,
              })}
            </Text>
          </Stack>
        </Box>

        <Box padding={20} className="account-detail-page__panel">
          <form onSubmit={handleSave}>
            <Stack gap={14}>
              <Text size="h4" as="h2" weight="semibold">
                {i18n.t("account_detail_page.rename_account")}
              </Text>
              <Input
                label={i18n.t("accounts_page.account_name")}
                value={name}
                onChange={setName}
                placeholder={
                  i18n.t("accounts_page.account_name_placeholder") as string
                }
                required
              />
              {error && <Text color="danger">{i18n.t(error)}</Text>}
              {success && <Text color="success">{i18n.t(success)}</Text>}
              <Stack direction="column" gap={12}>
                <Button type="submit" disabled={loading} fullWidth>
                  {loading
                    ? i18n.t("account_detail_page.saving")
                    : i18n.t("account_detail_page.save")}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  fullWidth
                >
                  {deleting
                    ? i18n.t("account_detail_page.deleting")
                    : i18n.t("account_detail_page.delete_account")}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>

        <div className="account-detail-page__entries">
          <Text size="h4" as="h2" weight="semibold">
            {i18n.t("account_detail_page.related_entries")}
          </Text>
          <EntryList
            entries={entries}
            showDelete={false}
            entryHref={(entryItem) => `/entries/${entryItem.id}`}
          />
        </div>
      </Stack>
    </Container>
  );
}
