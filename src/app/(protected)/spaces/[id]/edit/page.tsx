import { SpaceEditFormSection } from "@/app/(protected)/spaces/[id]/edit/space_edit_form_section";
import { Container, Hero } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type SpaceEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: SpaceEditPageProps): Promise<React.ReactElement> {
  const { id } = await params;

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

        <SpaceEditFormSection id={id} />
      </Stack>
    </Container>
  );
}
