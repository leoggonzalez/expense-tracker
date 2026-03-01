import { LoginPage } from "@/components";
import { requireAnonymous } from "@/lib/session";

export default async function Page(): Promise<React.ReactElement> {
  await requireAnonymous();

  return <LoginPage />;
}
