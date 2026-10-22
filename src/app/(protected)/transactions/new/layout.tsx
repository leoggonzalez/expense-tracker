import { NewTransactionRecentSection } from "@/components/new_transaction_recent_section/new_transaction_recent_section";

interface TransactionsNewLayoutProps {
  children: React.ReactNode;
}

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
