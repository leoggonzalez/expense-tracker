"use client";

import { archiveAccount, unarchiveAccount } from "@/actions/accounts";
import { ConfirmDialog } from "@/components/confirm_dialog/confirm_dialog";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import React, { useState } from "react";
import { i18n } from "@/model/i18n";

type AccountArchiveDialogProps = {
  accountId: string;
  accountName: string;
  isOpen: boolean;
  mode: "archive" | "unarchive";
  closeHref: string;
};

export function AccountArchiveDialog({
  accountId,
  accountName,
  isOpen,
  mode,
  closeHref,
}: AccountArchiveDialogProps): React.ReactElement {
  const { push } = useNavigationProgress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    const result =
      mode === "archive"
        ? await archiveAccount(accountId, "delete")
        : await unarchiveAccount(accountId);

    if (!result.success) {
      setError(String(i18n.t(result.error || "accounts_page.archive_failed")));
      setIsSubmitting(false);
      return;
    }

    push("/accounts");
  };

  const title =
    mode === "archive"
      ? String(i18n.t("accounts_page.archive_dialog_title"))
      : String(i18n.t("accounts_page.unarchive_dialog_title"));
  const description =
    mode === "archive"
      ? String(
          i18n.t("accounts_page.archive_dialog_description", {
            account: accountName,
          }),
        )
      : String(
          i18n.t("accounts_page.unarchive_dialog_description", {
            account: accountName,
          }),
        );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      description={description}
      confirmLabel={
        mode === "archive"
          ? isSubmitting
            ? String(i18n.t("accounts_page.archiving"))
            : String(i18n.t("accounts_page.archive_account"))
          : isSubmitting
            ? String(i18n.t("accounts_page.unarchiving"))
            : String(i18n.t("accounts_page.unarchive"))
      }
      cancelLabel={String(i18n.t("accounts_page.cancel"))}
      confirmVariant={mode === "archive" ? "outline-danger" : "secondary"}
      isLoading={isSubmitting}
      error={error}
      onConfirm={handleConfirm}
      onClose={() => push(closeHref)}
    />
  );
}
