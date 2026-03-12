"use client";

import React, { useState } from "react";

import { createAccount } from "@/actions/accounts";
import { Button, Input, useNavigationProgress } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export function AccountCreateForm(): React.ReactElement {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useNavigationProgress();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const result = await createAccount({ name });

    if (!result.success) {
      setError(result.error || "accounts_page.create_failed");
      setIsLoading(false);
      return;
    }

    push("/accounts");
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

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? i18n.t("accounts_page.creating")
              : i18n.t("accounts_page.create")}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
