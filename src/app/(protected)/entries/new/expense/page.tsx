import {
  Container,
  EntryCreationIntro,
  EntryForm,
  EntryTypeTabs,
  Hero,
  PagePanel,
} from "@/components";
import { getSpaces } from "@/actions/entries";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const spaces = await getSpaces();

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="expense"
          title={String(i18n.t("new_entry_page.title_expense"))}
          pattern="new_entry"
        >
          <EntryCreationIntro
            pageType="expense"
            subtitle={i18n.t("new_entry_page.subtitle_expense")}
          />
        </Hero>

        <EntryTypeTabs
          activeType="expense"
          tabs={[
            {
              key: "income",
              href: "/entries/new/income",
              label: i18n.t("new_entry_page.income_tab"),
            },
            {
              key: "expense",
              href: "/entries/new/expense",
              label: i18n.t("new_entry_page.expense_tab"),
            },
            {
              key: "transfer",
              href: "/entries/new/transfer",
              label: i18n.t("new_entry_page.transfer_tab"),
            },
          ]}
        />

        <PagePanel tone="form">
          <EntryForm
            spaces={spaces.map((space) => space.name)}
            entryType="expense"
            hideTypeField
          />
        </PagePanel>
      </Stack>
    </Container>
  );
}
