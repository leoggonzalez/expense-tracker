"use client";

import React from "react";

import { AppErrorCard } from "@/components";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({
  error,
}: ErrorPageProps): React.ReactElement {
  return <AppErrorCard error={error} />;
}
