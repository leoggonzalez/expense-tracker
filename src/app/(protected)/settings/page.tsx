import { SettingsPage } from "@/components";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  return <SettingsPage />;
}
