"use client";

import "./space_create_form.scss";

import React, { useState } from "react";

import { createSpace } from "@/actions/spaces";
import { Button, Input, useNavigationProgress } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export function SpaceCreateForm(): React.ReactElement {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useNavigationProgress();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const result = await createSpace({ name });

    if (!result.success) {
      setError(result.error || "spaces_page.create_failed");
      setIsLoading(false);
      return;
    }

    push("/spaces");
  };

  return (
    <div className="space-create-form">
      <form onSubmit={handleSubmit}>
        <Stack gap={16}>
          <Input
            label={i18n.t("spaces_page.space_name")}
            value={name}
            onChange={setName}
            placeholder={
              i18n.t("spaces_page.space_name_placeholder") as string
            }
            required
          />

          {error ? <Text color="danger">{i18n.t(error)}</Text> : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? i18n.t("spaces_page.creating")
              : i18n.t("spaces_page.create")}
          </Button>
        </Stack>
      </form>
    </div>
  );
}
