"use client";

import "@/styles/globals.scss";

import React from "react";

import { AppErrorCard } from "@/components";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
}: GlobalErrorPageProps): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <AppErrorCard error={error} />
      </body>
    </html>
  );
}
