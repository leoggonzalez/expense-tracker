"use client";

import "./entry_detail_page.scss";

import {
  Button,
  Container,
  EntryForm,
  useNavigationProgress,
} from "@/components";
import React, { useState } from "react";
import { deleteEntry } from "@/actions/entries";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntryDetailPageProps = {
  accounts: string[];
  entry: {
    id: string;
    type: string;
    accountName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
  };
};

export function EntryDetailPage({
  accounts,
  entry,
}: EntryDetailPageProps): React.ReactElement {
  const { push, refresh } = useNavigationProgress();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(i18n.t("entry_detail_page.delete_confirm") as string)) {
      return;
    }

    setDeleting(true);
    const result = await deleteEntry(entry.id);

    if (!result.success) {
      setDeleting(false);
      return;
    }

    push("/entries");
  };

  return (
    <Container>
      <Stack gap={24} className="entry-detail-page">
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("entry_detail_page.title")}
        </Text>
        <Card padding={24} className="entry-detail-page__card">
          <Stack gap={16}>
            <EntryForm
              accounts={accounts}
              initialData={entry}
              isEdit
              onSuccess={refresh}
            />
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              fullWidth
            >
              {deleting
                ? i18n.t("entry_detail_page.deleting")
                : i18n.t("entry_detail_page.delete")}
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
