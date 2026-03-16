import { AuthFormShell, Container, VerifyLoginForm } from "@/components";

type VerifyLoginRouteProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function Page({
  searchParams,
}: VerifyLoginRouteProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <Container>
      <AuthFormShell>
        <VerifyLoginForm initialEmail={params.email || ""} />
      </AuthFormShell>
    </Container>
  );
}
