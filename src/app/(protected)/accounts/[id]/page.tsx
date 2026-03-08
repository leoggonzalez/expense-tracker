import { notFound } from "next/navigation";

import { AccountDetailPage } from "@/components";
import { getAccountById } from "@/actions/accounts";

export const dynamic = "force-dynamic";

type AccountRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: AccountRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const account = await getAccountById(id);

  if (!account) {
    notFound();
  }

  return (
    <AccountDetailPage
      account={{
        ...account,
        entries: account.entries.map((entry) => ({
          ...entry,
          beginDate: entry.beginDate.toISOString(),
          endDate: entry.endDate?.toISOString() || null,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
      }}
    />
  );
}
