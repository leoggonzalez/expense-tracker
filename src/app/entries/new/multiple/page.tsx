import { BulkEntryForm, NewEntryPage } from "@/components";
import { getAccounts } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const accounts = await getAccounts();

  return (
    <NewEntryPage activeTab="multiple">
      <BulkEntryForm accounts={accounts.map((account) => account.name)} />
    </NewEntryPage>
  );
}
