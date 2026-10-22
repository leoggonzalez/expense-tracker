/** Currento typography tokens, independent of the rendered HTML element. */
export const textVariants = {
  fine: "xs",
  caption: "sm",
  body: "md",
  lead: "lg",
  title: "xl",
  display: "2xl",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
} as const;

export type TextVariant = keyof typeof textVariants;
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextType =
  | TextVariant
  | `${TextVariant}-${Exclude<TextWeight, "normal">}`;
