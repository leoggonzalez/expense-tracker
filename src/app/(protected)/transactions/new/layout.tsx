import { NewTransactionRecentSection } from "@/app/(protected)/transactions/new/new_transaction_recent_section";

type TransactionsNewLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({
  children,
}: TransactionsNewLayoutProps): Promise<React.ReactElement> {
  return (
    <>
      {children}
      <NewTransactionRecentSection />
    </>
  );
}
