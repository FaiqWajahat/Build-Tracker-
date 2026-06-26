"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, onPageChange, loading = false }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-4 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          type="button"
          className="relative inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
          type="button"
          className="relative ml-3 inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            Showing page <span className="font-bold text-foreground">{page}</span> of{" "}
            <span className="font-bold text-foreground">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-xs" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || loading}
              type="button"
              className="relative inline-flex items-center rounded-l-xl border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted focus:z-20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  type="button"
                  className={`relative inline-flex items-center border border-border bg-card px-3 py-2 text-xs font-medium focus:z-20 transition-all cursor-pointer ${
                    page === 1
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="relative inline-flex items-center border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                    ...
                  </span>
                )}
              </>
            )}
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={loading}
                type="button"
                className={`relative inline-flex items-center border border-border px-3 py-2 text-xs font-medium focus:z-20 transition-all cursor-pointer ${
                  page === p
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="relative inline-flex items-center border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  type="button"
                  className={`relative inline-flex items-center border border-border bg-card px-3 py-2 text-xs font-medium focus:z-20 transition-all cursor-pointer ${
                    page === totalPages
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || loading}
              type="button"
              className="relative inline-flex items-center rounded-r-xl border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted focus:z-20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
