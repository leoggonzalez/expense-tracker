import { AccountPage } from "@/components";
import { requireCurrentUser } from "@/lib/session";

export default async function Page(): Promise<React.ReactElement> {
  const currentUser = await requireCurrentUser();

  return (
    <AccountPage
      user={{
        email: currentUser.email,
        name: currentUser.name,
      }}
    />
  );
}
