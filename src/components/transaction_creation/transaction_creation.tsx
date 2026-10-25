import React from "react";

import {
  Container,
  Hero,
  PagePanel,
  TransactionCreationIntro,
  TransactionForm,
  TransactionTypeTabs,
} from "@/components";
import { NewTransferFormSection } from "@/components/new_transfer_form_section/new_transfer_form_section";
import { Stack } from "@/elements";
import { getTransactionCreationBase } from "@/lib/transaction_creation";
import { i18n } from "@/model/i18n";

interface TransactionCreationProps {
  operation: "income" | "expense" | "transfer";
  space?: { id: string; name: string };
  initialTransferValues?: {
    fromSpaceId: string;
    toSpaceId: string;
    description: string;
    amount: string;
  };
}

export function TransactionCreation({
  operation,
  space,
  initialTransferValues,
}: TransactionCreationProps): React.ReactElement {
  const base = getTransactionCreationBase(space?.id);
  const title = space
    ? i18n.t(`new_transaction_page.title_${operation}_in_space`, {
        space: space.name,
      })
    : i18n.t(`new_transaction_page.title_${operation}`);

  return (
    <Container>
      <Stack gap={24}>
        <Hero icon={operation} title={String(title)} pattern="new_transaction">
          <TransactionCreationIntro
            pageType={operation}
            subtitle={i18n.t(`new_transaction_page.subtitle_${operation}`)}
          />
        </Hero>
        <TransactionTypeTabs
          activeType={operation}
          tabs={(["income", "expense", "transfer"] as const).map((type) => ({
            key: type,
            href: `${base}/${type}`,
            label: i18n.t(`new_transaction_page.${type}_tab`),
          }))}
        />
        {operation === "transfer" ? (
          <NewTransferFormSection
            key={space?.id || "global"}
            fixedFromSpaceId={space?.id}
            initialValues={
              initialTransferValues || {
                fromSpaceId: space?.id || "",
                toSpaceId: "",
                description: "",
                amount: "",
              }
            }
          />
        ) : (
          <PagePanel tone="form">
            <TransactionForm
              key={`${space?.id || "global"}-${operation}`}
              spaces={[]}
              fixedSpace={space}
              transactionType={operation}
              hideTypeField
            />
          </PagePanel>
        )}
      </Stack>
    </Container>
  );
}
