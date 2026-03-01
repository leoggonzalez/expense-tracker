import { AllEntriesPage } from "@/components";
import { requireCurrentUser } from "@/lib/session";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();
  return <AllEntriesPage />;
}
