export function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "");

  if (!cleaned) {
    return "";
  }

  const separatorIndex = cleaned.search(/[.,]/);

  if (separatorIndex === -1) {
    const normalizedInteger = cleaned.replace(/^0+(?=\d)/, "");
    return normalizedInteger || "0";
  }

  const integerPart = cleaned.slice(0, separatorIndex).replace(/[.,]/g, "");
  const decimalPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "");
  const separator = cleaned[separatorIndex];
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";

  return `${normalizedInteger}${separator}${decimalPart}`;
}

export function parseAmountInput(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}
