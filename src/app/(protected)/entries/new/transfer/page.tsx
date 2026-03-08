import { getAccounts } from "@/actions/entries";
import { NewEntryPage, TransferForm } from "@/components";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getAccounts();

  return (
    <NewEntryPage pageType="transfer">
      <TransferForm
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
        }))}
      />
    </NewEntryPage>
  );
}
