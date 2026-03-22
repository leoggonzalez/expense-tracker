import { AuthFormShell, LoginForm } from "@/components";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <AuthFormShell>
      <LoginForm />
    </AuthFormShell>
  );
}
