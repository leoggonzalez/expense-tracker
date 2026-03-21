"use client";

import type { CurrentUserAccountProfilePayload } from "@/actions/user_account";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AccountProfileForm,
  Button,
  LoadingSkeleton,
  PagePanel,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const accountProfileCache = {
  entries: new Map<string, CurrentUserAccountProfilePayload>(),
};

function AccountProfileSkeleton(): React.ReactElement {
  return (
    <PagePanel tone="form">
      <Stack gap={20}>
        <LoadingSkeleton width="120px" height={18} radius={10} />
        <LoadingSkeleton width="200px" height={18} radius={10} />
        <LoadingSkeleton width="100%" height={56} radius={18} />
        <LoadingSkeleton width="100%" height={48} radius={18} />
        <LoadingSkeleton width="100%" height={48} radius={18} />
      </Stack>
    </PagePanel>
  );
}

export function AccountProfileSection(): React.ReactElement {
  const endpoint = "/api/account/profile";
  const { data, isLoading, hasError, isNotFound, retry } =
    useProtectedPageSection(endpoint, endpoint, accountProfileCache);

  if (hasError && !data) {
    return (
      <Card padding={24}>
        <Stack gap={12} align="flex-start">
          <Text color="secondary">{i18n.t("account.profile_load_failed")}</Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {i18n.t("common.retry")}
          </Button>
        </Stack>
      </Card>
    );
  }

  if (isNotFound) {
    return (
      <Card padding={24}>
        <Text color="secondary">{i18n.t("account.not_found")}</Text>
      </Card>
    );
  }

  if (isLoading && !data) {
    return <AccountProfileSkeleton />;
  }

  if (!data) {
    return <></>;
  }

  return (
    <PagePanel tone="form">
      <AccountProfileForm
        userAccount={{
          email: data.email,
          name: data.name,
        }}
      />
    </PagePanel>
  );
}
