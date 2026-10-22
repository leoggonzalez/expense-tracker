export function getSpaceIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/spaces\/([^/]+)(?:\/|$)/);
  return match && !["new", "archived"].includes(match[1])
    ? match[1]
    : undefined;
}

export function getTransactionCreationBase(spaceId?: string): string {
  return spaceId
    ? `/spaces/${encodeURIComponent(spaceId)}/new`
    : "/transactions/new";
}

export function isTransactionDraftPath(pathname: string): boolean {
  return /^(?:\/transactions|\/spaces\/[^/]+)\/new\/(income|expense)$/.test(
    pathname,
  );
}
