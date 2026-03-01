import { SettingsPage } from "@/components";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const currentUser = await requireCurrentUser();

  return (
    <SettingsPage
      user={{
        email: currentUser.email,
        name: currentUser.name,
      }}
    />
  );
}
