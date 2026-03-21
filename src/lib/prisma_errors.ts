export type PrismaErrorWithCode = {
  code: string;
};

export function isPrismaErrorWithCode(
  error: unknown,
): error is PrismaErrorWithCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}
