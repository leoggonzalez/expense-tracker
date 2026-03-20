import { requireCurrentUserAccount } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  await requireCurrentUserAccount();

  return <>{children}</>;
}
