"use client";

import { deleteTransaction } from "@/actions/transactions";
import { ConfirmDialog } from "@/components/confirm_dialog/confirm_dialog";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import React, { useState } from "react";
import { i18n } from "@/model/i18n";

type DeleteTransactionDialogProps = {
  transactionId: string;
  isOpen: boolean;
  closeHref: string;
};

export function DeleteTransactionDialog({
  transactionId,
  isOpen,
  closeHref,
}: DeleteTransactionDialogProps): React.ReactElement {
  const { push } = useNavigationProgress();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteTransaction(transactionId);

    if (!result.success) {
      setError(String(i18n.t("errors.failed_to_delete_transaction")));
      setIsDeleting(false);
      return;
    }

    push("/transactions");
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={String(i18n.t("transaction_detail_page.delete_dialog_title"))}
      description={String(
        i18n.t("transaction_detail_page.delete_dialog_description"),
      )}
      confirmLabel={
        isDeleting
          ? String(i18n.t("transaction_detail_page.deleting"))
          : String(i18n.t("transaction_detail_page.delete"))
      }
      cancelLabel={String(i18n.t("transaction_detail_page.cancel_delete"))}
      confirmVariant="outline-danger"
      isLoading={isDeleting}
      error={error}
      onConfirm={handleConfirm}
      onClose={() => push(closeHref)}
    />
  );
}
