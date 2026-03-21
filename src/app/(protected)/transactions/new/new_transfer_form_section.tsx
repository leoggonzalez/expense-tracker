"use client";

import type { NewTransferSpacesPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { Button, LoadingSkeleton, PagePanel, TransferForm } from "@/components";
import { Stack, Text } from "@/elements";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

const newTransferSpacesCache = {
  entries: new Map<string, NewTransferSpacesPayload>(),
};

type NewTransferFormSectionProps = {
  initialValues: {
    toSpaceId: string;
    description: string;
    amount: string;
  };
};

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
        <Stack gap={12} align="flex-start">
          <Text color="secondary">
            {i18n.t("new_transaction_page.transfer_form_load_failed")}
          </Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {i18n.t("common.retry")}
          </Button>
        </Stack>
      </PagePanel>
    );
  }

  if (isLoading && !data) {
    return <NewTransferFormSkeleton />;
  }

  const toSpace = data?.spaces.find((space) => space.id === initialValues.toSpaceId);
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
      />
    </PagePanel>
  );
}
