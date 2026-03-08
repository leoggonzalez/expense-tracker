import { requireAnonymous } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  await requireAnonymous();

  return <>{children}</>;
}
