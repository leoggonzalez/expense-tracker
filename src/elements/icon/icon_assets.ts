export const iconAssets = {
  example: new URL("./icons/example.svg", import.meta.url).toString(),
  "example-2": new URL("./icons/example-2.svg", import.meta.url).toString(),
  dashboard: new URL("./icons/dashboard.svg", import.meta.url).toString(),
  projection: new URL("./icons/projection.svg", import.meta.url).toString(),
  transactions: new URL("./icons/transactions.svg", import.meta.url).toString(),
  spaces: new URL("./icons/spaces.svg", import.meta.url).toString(),
  activity: new URL("./icons/activity.svg", import.meta.url).toString(),
  calendar: new URL("./icons/calendar.svg", import.meta.url).toString(),
  settings: new URL("./icons/settings.svg", import.meta.url).toString(),
  login: new URL("./icons/login.svg", import.meta.url).toString(),
  income: new URL("./icons/income.svg", import.meta.url).toString(),
  expense: new URL("./icons/expense.svg", import.meta.url).toString(),
  transfer: new URL("./icons/transfer.svg", import.meta.url).toString(),
  plus: new URL("./icons/plus.svg", import.meta.url).toString(),
  trash: new URL("./icons/trash.svg", import.meta.url).toString(),
  edit: new URL("./icons/edit.svg", import.meta.url).toString(),
  "external-link": new URL(
    "./icons/external-link.svg",
    import.meta.url,
  ).toString(),
  close: new URL("./icons/close.svg", import.meta.url).toString(),
  "chevron-left": new URL(
    "./icons/chevron-left.svg",
    import.meta.url,
  ).toString(),
  "chevron-down": new URL(
    "./icons/chevron-down.svg",
    import.meta.url,
  ).toString(),
  "chevron-right": new URL(
    "./icons/chevron-right.svg",
    import.meta.url,
  ).toString(),
  check: new URL("./icons/check.svg", import.meta.url).toString(),
  alert: new URL("./icons/alert.svg", import.meta.url).toString(),
  "dots-horizontal": new URL(
    "./icons/dots-horizontal.svg",
    import.meta.url,
  ).toString(),
} as const;

export type IconName = keyof typeof iconAssets;
