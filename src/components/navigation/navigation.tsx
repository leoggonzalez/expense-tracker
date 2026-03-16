import { getCurrentUser } from "@/lib/session";

import { NavigationClient } from "@/components/navigation/navigation_client";

export async function Navigation(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  return (
    <NavigationClient
      currentUser={
        currentUser
          ? {
              email: currentUser.email,
              name: currentUser.name,
            }
          : null
      }
      isAuthenticated={Boolean(currentUser)}
    />
  );
}
