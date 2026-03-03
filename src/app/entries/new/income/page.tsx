import { EntryForm, NewEntryPage } from "@/components";
import { getAccounts } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const accounts = await getAccounts();

  return (
    <NewEntryPage activeTab="income">
      <EntryForm
        accounts={accounts.map((account) => account.name)}
        entryType="income"
        hideTypeField
      />
    </NewEntryPage>
  );
}
