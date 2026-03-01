"use client";

import "./entry_detail_page.scss";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Container, EntryForm } from "@/components";
import { deleteEntry } from "@/actions/entries";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntryDetailPageProps = {
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
  entry,
}: EntryDetailPageProps): React.ReactElement {
  const router = useRouter();
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

    router.push("/entries");
    router.refresh();
  };

  return (
    <Container>
      <div className="entry-detail-page">
        <Stack gap={24}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t("entry_detail_page.title")}
          </Text>
          <Box padding={24} className="entry-detail-page__card">
            <Stack gap={16}>
              <EntryForm
                initialData={entry}
                isEdit
                hideTypeField
                entryType={entry.type as "income" | "expense"}
                onSuccess={() => router.refresh()}
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
          </Box>
        </Stack>
      </div>
    </Container>
  );
}
