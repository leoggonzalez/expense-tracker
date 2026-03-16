import {
  BulkEntryForm,
  Container,
  EntryCreationIntro,
  Hero,
  PagePanel,
} from "@/components";
import { getAccounts } from "@/actions/entries";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getAccounts();

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="entries"
          title={String(i18n.t("new_entry_page.title_multiple"))}
          pattern="new_entry"
        >
          <EntryCreationIntro
            pageType="multiple"
            subtitle={i18n.t("new_entry_page.subtitle_multiple")}
          />
        </Hero>

        <PagePanel tone="form">
          <BulkEntryForm accounts={accounts.map((account) => account.name)} />
        </PagePanel>
      </Stack>
    </Container>
  );
}
