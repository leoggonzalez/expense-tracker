"use client";

import { SectionError } from "@/components/section_error/section_error";

import React, { useState } from "react";

import { unarchiveSpace, type ArchivedSpacesPayload } from "@/actions/spaces";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Avatar,
  Button,
  Container,
  Currency,
  LoadingSkeleton,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const archivedSpacesCache = {
  entries: new Map<string, ArchivedSpacesPayload>(),
};

function ArchivedSpacesSkeleton(): React.ReactElement {
  return (
    <Stack gap={16}>
      <LoadingSkeleton width="100%" height={90} radius={24} />
      <LoadingSkeleton width="100%" height={90} radius={24} />
    </Stack>
  );
}

export function ArchivedSpacesSection(): React.ReactElement {
  const endpoint = "/api/spaces/archived";
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    archivedSpacesCache,
  );
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUnarchive(spaceId: string): Promise<void> {
    setPendingSpaceId(spaceId);
    setError(null);

    const result = await unarchiveSpace(spaceId);

    if (!result.success) {
      setError(result.error || "spaces_page.unarchive_failed");
      setPendingSpaceId(null);
      return;
    }

    retry();
    setPendingSpaceId(null);
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text type="h2-bold" element="h1">
          {i18n.t("spaces_page.archived_spaces")}
        </Text>

        {hasError && !data ? (
          <Card padding={24}>
            <SectionError
              message={i18n.t("spaces_page.archived_load_failed")}
              retryLabel={i18n.t("common.retry")}
              onRetry={retry}
            />
          </Card>
        ) : isLoading && !data ? (
          <ArchivedSpacesSkeleton />
        ) : data && data.spaces.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text element="p" color="secondary">
              {i18n.t("spaces_page.empty_archived_state")}
            </Text>
          </Card>
        ) : (
          <Stack gap={16}>
            {error ? (
              <Text element="p" color="danger">
                {i18n.t(error)}
              </Text>
            ) : null}
            {(data?.spaces || []).map((space) => (
              <Card key={space.id} padding={16}>
                <Stack line align="center" justify="space-between" gap={12}>
                  <Stack line align="center" gap={12}>
                    <Avatar name={space.name} />
                    <Stack gap={4}>
                      <Text element="p" type="body-semibold">
                        {space.name}
                      </Text>
                      <Currency
                        value={space.currentMonthTotal}
                        type="caption-bold"
                      />
                    </Stack>
                  </Stack>

                  <Button
                    onClick={() => {
                      void handleUnarchive(space.id);
                    }}
                    disabled={pendingSpaceId === space.id}
                  >
                    {pendingSpaceId === space.id
                      ? i18n.t("spaces_page.unarchiving")
                      : i18n.t("spaces_page.unarchive")}
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        <AppLink href="/spaces">{i18n.t("spaces_page.back_to_spaces")}</AppLink>
      </Stack>
    </Container>
  );
}
