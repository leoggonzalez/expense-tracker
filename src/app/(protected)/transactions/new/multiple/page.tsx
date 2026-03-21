import {
  BulkTransactionForm,
  Container,
  TransactionCreationIntro,
  Hero,
  PagePanel,
} from "@/components";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="transactions"
          title={String(i18n.t("new_transaction_page.title_multiple"))}
          pattern="new_transaction"
        >
          <TransactionCreationIntro
            pageType="multiple"
            subtitle={i18n.t("new_transaction_page.subtitle_multiple")}
          />
        </Hero>

        <PagePanel tone="form">
          <BulkTransactionForm spaces={[]} />
        </PagePanel>
      </Stack>
    </Container>
  );
}
