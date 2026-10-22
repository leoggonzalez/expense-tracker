"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { NewTransferSpacesPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { LoadingSkeleton, PagePanel, TransferForm } from "@/components";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";
import { format } from "date-fns";

const newTransferSpacesCache = {
  entries: new Map<string, NewTransferSpacesPayload>(),
};

interface NewTransferFormSectionProps {
  fixedFromSpaceId?: string;
  initialValues: {
    fromSpaceId: string;
    toSpaceId: string;
    description: string;
    amount: string;
  };
}

function NewTransferFormSkeleton(): React.ReactElement {
  return (
    <PagePanel tone="form">
      <Stack gap={16}>
        <LoadingSkeleton width="100%" height={56} radius={18} />
        <LoadingSkeleton width="100%" height={56} radius={18} />
        <LoadingSkeleton width="100%" height={56} radius={18} />
      </Stack>
    </PagePanel>
  );
}

export function NewTransferFormSection({
  initialValues,
  fixedFromSpaceId,
}: NewTransferFormSectionProps): React.ReactElement {
  const endpoint = "/api/transactions/new/transfer";
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    newTransferSpacesCache,
  );

  if (hasError && !data) {
    return (
      <PagePanel tone="form">
        <SectionError
          message={i18n.t("new_transaction_page.transfer_form_load_failed")}
          retryLabel={i18n.t("common.retry")}
          onRetry={retry}
        />
      </PagePanel>
    );
  }

  if (isLoading && !data) {
    return <NewTransferFormSkeleton />;
  }

  const toSpace = data?.spaces.find(
    (space) => space.id === initialValues.toSpaceId,
  );
  const resolvedInitialValues = {
    ...initialValues,
    description:
      initialValues.description ||
      (toSpace
        ? String(
            i18n.t("spaces_page.settle_description", {
              space: toSpace.name,
              month: format(new Date(), "MMMM yyyy"),
            }),
          )
        : ""),
  };

  return (
    <PagePanel tone="form">
      <TransferForm
        spaces={data?.spaces || []}
        initialValues={resolvedInitialValues}
        fixedFromSpaceId={fixedFromSpaceId}
      />
    </PagePanel>
  );
}
