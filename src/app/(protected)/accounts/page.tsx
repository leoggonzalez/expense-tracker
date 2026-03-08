import { AccountsPage } from "@/components";
import { getAccountsWithSummary } from "@/actions/accounts";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getAccountsWithSummary();

  return <AccountsPage accounts={accounts} />;
}
