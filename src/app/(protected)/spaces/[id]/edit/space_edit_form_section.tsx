"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { SpaceEditPayload } from "@/actions/spaces";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  LoadingSkeleton,
  PagePanel,
  SpaceEditForm,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const spaceEditCache = {
  entries: new Map<string, SpaceEditPayload>(),
};

interface SpaceEditFormSectionProps {
  id: string;
}

function SpaceEditFormSkeleton(): React.ReactElement {
  return (
    <PagePanel tone="form">
      <Stack gap={16}>
        <LoadingSkeleton width="100%" height={56} radius={18} />
        <LoadingSkeleton width="120px" height={48} radius={18} />
      </Stack>
    </PagePanel>
  );
}

export function SpaceEditFormSection({
  id,
}: SpaceEditFormSectionProps): React.ReactElement {
  const endpoint = `/api/spaces/${id}/edit`;
  const { data, isLoading, hasError, isNotFound, retry } =
    useProtectedPageSection(endpoint, endpoint, spaceEditCache);

  if (hasError && !data) {
    return (
      <Stack gap={24}>
        <Card padding={24}>
          <SectionError
            message={i18n.t("spaces_page.edit_form_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        </Card>
        <AppLink href="/spaces">{i18n.t("spaces_page.back_to_spaces")}</AppLink>
      </Stack>
    );
  }

  if (isNotFound) {
    return (
      <Stack gap={24}>
        <Card padding={24}>
          <Text element="p" color="secondary">
            {i18n.t("space_detail_page.not_found")}
          </Text>
        </Card>
        <AppLink href="/spaces">{i18n.t("spaces_page.back_to_spaces")}</AppLink>
      </Stack>
    );
  }

  if (isLoading && !data) {
    return <SpaceEditFormSkeleton />;
  }

  if (!data) {
    return <></>;
  }

  return (
    <Stack gap={24}>
      <PagePanel tone="form">
        <SpaceEditForm
          spaceId={data.id}
          initialName={data.name}
          initialType={data.type}
          initialPaymentDueDay={data.paymentDueDay}
          initialPaymentTiming={data.paymentTiming}
        />
      </PagePanel>

      <AppLink href={`/spaces/${data.id}`}>
        {i18n.t("spaces_page.back_to_space")}
      </AppLink>
    </Stack>
  );
}
