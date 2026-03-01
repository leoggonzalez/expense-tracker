import { AccountsPage } from "@/components";
import { getAccountsWithSummary } from "@/actions/accounts";
import { requireCurrentUser } from "@/lib/session";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const accounts = await getAccountsWithSummary();

  return <AccountsPage accounts={accounts} />;
}
