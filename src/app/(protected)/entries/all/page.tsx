import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type EntriesAllPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({
  searchParams,
}: EntriesAllPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }

    if (value) {
      query.set(key, value);
    }
  });

  redirect(query.size > 0 ? `/entries?${query.toString()}` : "/entries");
}
