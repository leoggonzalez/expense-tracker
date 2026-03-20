"use client";

import { archiveSpace, unarchiveSpace } from "@/actions/spaces";
import { ConfirmDialog } from "@/components/confirm_dialog/confirm_dialog";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import React, { useState } from "react";
import { i18n } from "@/model/i18n";

type SpaceArchiveDialogProps = {
  spaceId: string;
  spaceName: string;
  isOpen: boolean;
  mode: "archive" | "unarchive";
  closeHref: string;
};

export function SpaceArchiveDialog({
  spaceId,
  spaceName,
  isOpen,
  mode,
  closeHref,
}: SpaceArchiveDialogProps): React.ReactElement {
  const { push } = useNavigationProgress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    const result =
      mode === "archive"
        ? await archiveSpace(spaceId, "delete")
        : await unarchiveSpace(spaceId);

    if (!result.success) {
      setError(String(i18n.t(result.error || "spaces_page.archive_failed")));
      setIsSubmitting(false);
      return;
    }

    push("/spaces");
  };

  const title =
    mode === "archive"
      ? String(i18n.t("spaces_page.archive_dialog_title"))
      : String(i18n.t("spaces_page.unarchive_dialog_title"));
  const description =
    mode === "archive"
      ? String(
          i18n.t("spaces_page.archive_dialog_description", {
            space: spaceName,
          }),
        )
      : String(
          i18n.t("spaces_page.unarchive_dialog_description", {
            space: spaceName,
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
            ? String(i18n.t("spaces_page.archiving"))
            : String(i18n.t("spaces_page.archive_space"))
          : isSubmitting
            ? String(i18n.t("spaces_page.unarchiving"))
            : String(i18n.t("spaces_page.unarchive"))
      }
      cancelLabel={String(i18n.t("spaces_page.cancel"))}
      confirmVariant={mode === "archive" ? "outline-danger" : "secondary"}
      isLoading={isSubmitting}
      error={error}
      onConfirm={handleConfirm}
      onClose={() => push(closeHref)}
    />
  );
}
