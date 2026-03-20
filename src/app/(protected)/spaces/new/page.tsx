import {
  SpaceCreateForm,
  AppLink,
  Container,
  Hero,
  PagePanel,
} from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default function Page(): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="spaces"
          title={String(i18n.t("spaces_page.create_space"))}
          pattern="space_form"
        >
          <Text as="p" size="sm" color="inverse">
            {i18n.t("spaces_page.create_space_hint")}
          </Text>
        </Hero>

        <PagePanel tone="form">
          <SpaceCreateForm />
        </PagePanel>

        <AppLink href="/spaces">
          {i18n.t("spaces_page.back_to_spaces")}
        </AppLink>
      </Stack>
    </Container>
  );
}
