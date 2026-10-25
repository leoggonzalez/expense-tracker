import { notFound } from "next/navigation";

import { TransactionCreation } from "@/components/transaction_creation/transaction_creation";
import { Space } from "@/lib/space";
import { requireCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

interface SpaceNewOperationProps {
  params: Promise<{ id: string; operation: string }>;
}

export default async function Page({
  params,
}: SpaceNewOperationProps): Promise<React.ReactElement> {
  const { id, operation } = await params;
  if (
    operation !== "income" &&
    operation !== "expense" &&
    operation !== "transfer"
  )
    notFound();
  const currentUser = await requireCurrentUserAccount();
  const space = await Space.findOwnedById(currentUser.id, id);
  if (!space || space.toRecord().isArchived) notFound();
  return (
    <TransactionCreation
      operation={operation}
      space={{ id, name: space.toRecord().name }}
    />
  );
}
