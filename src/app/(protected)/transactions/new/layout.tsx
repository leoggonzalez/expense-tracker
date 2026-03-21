import { getRecentTransactions } from "@/actions/transactions";
import { NewTransactionRecentTransactions } from "@/components";

type TransactionsNewLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({
  children,
}: TransactionsNewLayoutProps): Promise<React.ReactElement> {
  const recentTransactions = await getRecentTransactions(5);

  const serializedTransactions = recentTransactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    spaceName: transaction.space.name,
    description: transaction.description,
    amount:
      transaction.type === "expense" && transaction.amount > 0
        ? -transaction.amount
        : transaction.amount,
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  }));

  return (
    <>
      {children}
      <NewTransactionRecentTransactions transactions={serializedTransactions} />
    </>
  );
}
