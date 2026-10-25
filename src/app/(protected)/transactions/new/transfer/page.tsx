import { TransactionCreation } from "@/components/transaction_creation/transaction_creation";
import { sanitizeAmountInput } from "@/lib/amount";

type TransferPageSearchParams = Promise<{
  from_space?: string;
  to_space?: string;
  description?: string;
  amount?: string;
}>;

interface TransferPageProps {
  searchParams: TransferPageSearchParams;
}

export default async function Page({
  searchParams,
}: TransferPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const initialValues = {
    fromSpaceId: params.from_space || "",
    toSpaceId: params.to_space || "",
    description: params.description || "",
    amount: sanitizeAmountInput(params.amount || ""),
  };

  return (
    <TransactionCreation
      operation="transfer"
      initialTransferValues={initialValues}
    />
  );
}
