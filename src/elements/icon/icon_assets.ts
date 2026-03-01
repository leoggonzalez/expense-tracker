export const iconAssets = {
  example: new URL("./icons/example.svg", import.meta.url).toString(),
  "example-2": new URL("./icons/example-2.svg", import.meta.url).toString(),
  dashboard: new URL("./icons/dashboard.svg", import.meta.url).toString(),
  projection: new URL("./icons/projection.svg", import.meta.url).toString(),
  entries: new URL("./icons/entries.svg", import.meta.url).toString(),
  accounts: new URL("./icons/accounts.svg", import.meta.url).toString(),
  settings: new URL("./icons/settings.svg", import.meta.url).toString(),
  login: new URL("./icons/login.svg", import.meta.url).toString(),
  income: new URL("./icons/income.svg", import.meta.url).toString(),
  expense: new URL("./icons/expense.svg", import.meta.url).toString(),
  plus: new URL("./icons/plus.svg", import.meta.url).toString(),
  close: new URL("./icons/close.svg", import.meta.url).toString(),
  check: new URL("./icons/check.svg", import.meta.url).toString(),
  alert: new URL("./icons/alert.svg", import.meta.url).toString(),
} as const;

export type IconName = keyof typeof iconAssets;
