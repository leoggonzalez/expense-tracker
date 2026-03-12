"use client";

import React, { useState } from "react";

import { updateAccount } from "@/actions/accounts";
import { Button, Input, useNavigationProgress } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type AccountEditFormProps = {
  accountId: string;
  initialName: string;
};

export function AccountEditForm({
  accountId,
  initialName,
}: AccountEditFormProps): React.ReactElement {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { push } = useNavigationProgress();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateAccount(accountId, { name });

    if (!result.success) {
      setError(result.error || "account_detail_page.update_failed");
      setIsLoading(false);
      return;
    }

    setSuccess("account_detail_page.update_success");
    setIsLoading(false);
    push(`/accounts/${accountId}`);
  };

  return (
    <Card padding={20}>
      <form onSubmit={handleSubmit}>
        <Stack gap={16}>
          <Input
            label={i18n.t("accounts_page.account_name")}
            value={name}
            onChange={setName}
            placeholder={
              i18n.t("accounts_page.account_name_placeholder") as string
            }
            required
          />

          {error ? <Text color="danger">{i18n.t(error)}</Text> : null}
          {success ? <Text color="success">{i18n.t(success)}</Text> : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? i18n.t("account_detail_page.saving")
              : i18n.t("account_detail_page.save")}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
