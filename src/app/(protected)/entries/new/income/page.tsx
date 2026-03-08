import { EntryForm, NewEntryPage } from "@/components";
import { getAccounts } from "@/actions/entries";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getAccounts();

  return (
    <NewEntryPage pageType="income">
      <EntryForm
        accounts={accounts.map((account) => account.name)}
        entryType="income"
        hideTypeField
      />
    </NewEntryPage>
  );
}
