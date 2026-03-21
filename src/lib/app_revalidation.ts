import { revalidatePath } from "next/cache";

const sharedMutationPaths = [
  "/",
  "/projection",
  "/transactions",
  "/transactions/all",
  "/settings",
] as const;

function revalidatePaths(paths: readonly string[]): void {
  paths.forEach((path) => {
    revalidatePath(path);
  });
}

export function revalidateSharedMutationPages(): void {
  revalidatePaths(sharedMutationPaths);
}

export function revalidateSpaceMutationPages(): void {
  revalidateSharedMutationPages();
  revalidatePaths(["/spaces", "/spaces/new", "/spaces/archived"]);
}

export function revalidateTransactionMutationPages(): void {
  revalidateSharedMutationPages();
  revalidatePath("/space");
}
