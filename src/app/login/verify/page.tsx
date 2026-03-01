import { VerifyLoginPage } from "@/components";
import { requireAnonymous } from "@/lib/session";

type VerifyLoginRouteProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function Page({
  searchParams,
}: VerifyLoginRouteProps): Promise<React.ReactElement> {
  await requireAnonymous();
  const params = await searchParams;

  return <VerifyLoginPage initialEmail={params.email || ""} />;
}
