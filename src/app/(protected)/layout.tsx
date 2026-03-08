import { requireCurrentUser } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  await requireCurrentUser();

  return <>{children}</>;
}
