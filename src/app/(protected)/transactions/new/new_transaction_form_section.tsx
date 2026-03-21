"use client";

import type { NewTransactionSpacesPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  BulkTransactionForm,
  Button,
  LoadingSkeleton,
  PagePanel,
  TransactionForm,
} from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const newTransactionSpacesCache = {
  entries: new Map<string, NewTransactionSpacesPayload>(),
};

type NewTransactionFormSectionProps = {
  pageType: "income" | "expense" | "multiple";
};

function NewTransactionFormSkeleton(): React.ReactElement {
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

export function NewTransactionFormSection({
  pageType,
}: NewTransactionFormSectionProps): React.ReactElement {
  const endpoint = "/api/transactions/new/spaces";
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    newTransactionSpacesCache,
  );

  if (hasError && !data) {
    return (
      <PagePanel tone="form">
        <Stack gap={12} align="flex-start">
          <Text color="secondary">
            {i18n.t("new_transaction_page.form_load_failed")}
          </Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {i18n.t("common.retry")}
          </Button>
        </Stack>
      </PagePanel>
    );
  }

  if (isLoading && !data) {
    return <NewTransactionFormSkeleton />;
  }

  if (pageType === "multiple") {
    return (
      <PagePanel tone="form">
        <BulkTransactionForm spaces={data?.spaces || []} />
      </PagePanel>
    );
  }

  return (
    <PagePanel tone="form">
      <TransactionForm
        spaces={data?.spaces || []}
        transactionType={pageType}
        hideTypeField
      />
    </PagePanel>
  );
}
