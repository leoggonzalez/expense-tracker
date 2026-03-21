"use client";

import { Pagination, useNavigationProgress } from "@/components";
import { usePathname, useSearchParams } from "next/navigation";

import React from "react";

type TransactionsPaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function TransactionsPagination({
  currentPage,
  totalPages,
}: TransactionsPaginationProps): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push } = useNavigationProgress();

  const onPageChange = (page: number): void => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }

    const query = nextParams.toString();
    push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
}
