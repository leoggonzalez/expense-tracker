import { notFound } from "next/navigation";

import { getSpaceForEdit } from "@/actions/spaces";
import {
  SpaceEditForm,
  AppLink,
  Container,
  Hero,
  PagePanel,
} from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type SpaceEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: SpaceEditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const space = await getSpaceForEdit(id);

  if (!space) {
    notFound();
  }

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="spaces"
          title={String(i18n.t("spaces_page.edit_space"))}
          pattern="space_form"
        >
          <Text as="p" size="sm" color="hero-muted">
            {i18n.t("spaces_page.edit_space_hint")}
          </Text>
        </Hero>

        <PagePanel tone="form">
          <SpaceEditForm spaceId={space.id} initialName={space.name} />
        </PagePanel>

        <AppLink href={`/spaces/${space.id}`}>
          {i18n.t("spaces_page.back_to_space")}
        </AppLink>
      </Stack>
    </Container>
  );
}
