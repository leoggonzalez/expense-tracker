import { EntryForm, NewEntryPage } from "@/components";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();

  return (
    <NewEntryPage activeTab="income">
      <EntryForm entryType="income" hideTypeField />
    </NewEntryPage>
  );
}
