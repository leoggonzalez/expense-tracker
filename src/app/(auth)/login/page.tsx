import { AuthFormShell, Container, LoginForm } from "@/components";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Container>
      <AuthFormShell>
        <LoginForm />
      </AuthFormShell>
    </Container>
  );
}
