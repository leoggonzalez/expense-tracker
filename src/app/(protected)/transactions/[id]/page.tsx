import { TransactionDetailSection } from "@/app/(protected)/transactions/[id]/transaction_detail_section";

type TransactionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    confirmDelete?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: TransactionPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;

  return <TransactionDetailSection id={id} isDeleteDialogOpen={query.confirmDelete === "1"} />;
}
