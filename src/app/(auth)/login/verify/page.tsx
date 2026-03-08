import { VerifyLoginPage } from "@/components";

type VerifyLoginRouteProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function Page({
  searchParams,
}: VerifyLoginRouteProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return <VerifyLoginPage initialEmail={params.email || ""} />;
}
