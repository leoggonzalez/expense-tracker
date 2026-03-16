"use client";

import React, { useState } from "react";

import { deleteEntry } from "@/actions/entries";
import { Button, useNavigationProgress } from "@/components";
import { i18n } from "@/model/i18n";

type DeleteEntryButtonProps = {
  entryId: string;
};

export function DeleteEntryButton({
  entryId,
}: DeleteEntryButtonProps): React.ReactElement {
  const { push } = useNavigationProgress();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!confirm(i18n.t("entry_detail_page.delete_confirm") as string)) {
      return;
    }

    setDeleting(true);
    const result = await deleteEntry(entryId);

    if (!result.success) {
      setDeleting(false);
      return;
    }

    push("/entries");
  };

  return (
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
  );
}
