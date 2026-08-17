"use client";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 5,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);

  // Helper to generate page numbers list e.g. [1, 2, 3, 4, 5]
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(safeTotalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= safeTotalPages && i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (end < safeTotalPages) {
        if (end < safeTotalPages - 1) pages.push("...");
        pages.push(safeTotalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-xs font-semibold text-gray-700 ${className}`}>
      {/* Items count indicator */}
      <div>
        {totalItems !== undefined ? (
          <span>
            Mostrando <span className="font-bold text-black">{totalItems > 0 ? startItem : 0}</span> a{" "}
            <span className="font-bold text-black">{endItem}</span> de{" "}
            <span className="font-bold text-black">{totalItems}</span> registros
          </span>
        ) : (
          <span>
            Página <span className="font-bold text-black">{currentPage}</span> de{" "}
            <span className="font-bold text-black">{safeTotalPages}</span>
          </span>
        )}
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          Anterior
        </button>

        {getPageNumbers().map((p, idx) => (
          <React.Fragment key={idx}>
            {typeof p === "number" ? (
              <button
                onClick={() => onPageChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  currentPage === p
                    ? "bg-[#0546F7] text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ) : (
              <span className="px-1 text-gray-400 font-normal">...</span>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
