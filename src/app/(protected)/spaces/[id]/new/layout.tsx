import { NewTransactionRecentSection } from "@/components/new_transaction_recent_section/new_transaction_recent_section";

interface SpaceNewLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function Layout({
  children,
  params,
}: SpaceNewLayoutProps): Promise<React.ReactElement> {
  const { id } = await params;
  return (
    <>
      {children}
      <NewTransactionRecentSection key={id} spaceId={id} />
    </>
  );
}
