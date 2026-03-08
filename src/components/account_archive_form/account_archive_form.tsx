"use client";

import React, { useState } from "react";

import { archiveAccount } from "@/actions/accounts";
import { Button, Input, useNavigationProgress } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type AccountArchiveFormProps = {
  accountId: string;
};

export function AccountArchiveForm({
  accountId,
}: AccountArchiveFormProps): React.ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useNavigationProgress();

  const handleArchive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const result = await archiveAccount(accountId, confirmationText);

    if (!result.success) {
      setError(result.error || "accounts_page.archive_failed");
      setIsLoading(false);
      return;
    }

    push("/accounts");
  };

  if (!isConfirming) {
    return (
      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        {i18n.t("accounts_page.archive")}
      </Button>
    );
  }

  return (
    <Card padding={16}>
      <form onSubmit={handleArchive}>
        <Stack gap={12}>
          <Text size="sm" color="secondary">
            {i18n.t("accounts_page.archive_confirm_help")}
          </Text>

          <Input
            label={i18n.t("accounts_page.archive_confirm_label")}
            value={confirmationText}
            onChange={setConfirmationText}
            placeholder="delete"
            required
          />

          {error ? <Text color="danger">{i18n.t(error)}</Text> : null}

          <Stack direction="row" gap={8}>
            <Button type="submit" variant="danger" disabled={isLoading}>
              {isLoading
                ? i18n.t("accounts_page.archiving")
                : i18n.t("accounts_page.archive_account")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsConfirming(false);
                setConfirmationText("");
                setError(null);
              }}
              disabled={isLoading}
            >
              {i18n.t("accounts_page.cancel")}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  );
}
