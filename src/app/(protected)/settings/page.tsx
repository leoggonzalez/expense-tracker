import { SettingsPage } from "@/components";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Expected authenticated user in protected settings route.");
  }

  return (
    <SettingsPage
      user={{
        email: currentUser.email,
        name: currentUser.name,
      }}
    />
  );
}
