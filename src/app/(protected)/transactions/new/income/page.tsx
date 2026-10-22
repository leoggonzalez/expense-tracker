import { TransactionCreation } from "@/components/transaction_creation/transaction_creation";

export default async function Page(): Promise<React.ReactElement> {
  return <TransactionCreation operation="income" />;
}
