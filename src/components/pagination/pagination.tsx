"use client";

import { Button } from "@/components";
import "@/components/pagination/pagination.scss";
import { Box, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps): React.ReactElement {
  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages === 0) return <></>;

  return (
    <div className="pagination">
      <Box padding={{ top: 24, bottom: 24 }}>
        <Stack line align="center" justify="center" gap={16} wrap>
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            size="sm"
          >
            {i18n.t("pagination.previous")}
          </Button>

          <Stack line align="center" gap={4} wrap>
            {startPage > 1 && (
              <>
                <button
                  className="pagination__page"
                  onClick={() => onPageChange(1)}
                >
                  1
                </button>
                {startPage > 2 && (
                  <Text element="span" type="caption" color="tertiary">
                    ...
                  </Text>
                )}
              </>
            )}

            {pages.map((page) => (
              <button
                key={page}
                className={`pagination__page ${
                  page === currentPage ? "pagination__page--active" : ""
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <Text element="span" type="caption" color="tertiary">
                    ...
                  </Text>
                )}
                <button
                  className="pagination__page"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
          </Stack>

          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            size="sm"
          >
            {i18n.t("pagination.next")}
          </Button>
        </Stack>
      </Box>
    </div>
  );
}
