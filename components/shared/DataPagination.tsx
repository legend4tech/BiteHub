"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export interface DataPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  getPageUrl?: (page: number) => string
  className?: string
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  getPageUrl,
  className = "",
}: DataPaginationProps) {
  if (totalPages <= 1 && (totalItems === undefined || totalItems <= pageSize)) {
    return null
  }

  const startItem =
    totalItems !== undefined ? (currentPage - 1) * pageSize + 1 : null
  const endItem =
    totalItems !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : null

  // Generate visible page numbers for desktop
  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("ellipsis")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("ellipsis")
      pages.push(totalPages)
    }
    return pages
  }

  const prevDisabled = currentPage <= 1
  const nextDisabled = currentPage >= totalPages

  const handlePageClick = (page: number, e: React.MouseEvent) => {
    if (!getPageUrl) {
      e.preventDefault()
      onPageChange?.(page)
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* Item summary / Page count info */}
      <div className="text-center text-xs text-muted-foreground sm:text-left">
        {totalItems !== undefined && startItem && endItem ? (
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">{startItem}</span>{" "}
            to <span className="font-semibold text-foreground">{endItem}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>{" "}
            results
          </span>
        ) : (
          <span>
            Page{" "}
            <span className="font-semibold text-foreground">{currentPage}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Shadcn UI Pagination Composition */}
      <Pagination className="mx-0 w-auto justify-center sm:justify-end">
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              href={
                getPageUrl
                  ? prevDisabled
                    ? "#"
                    : getPageUrl(currentPage - 1)
                  : "#"
              }
              onClick={(e) => {
                if (!prevDisabled) handlePageClick(currentPage - 1, e)
                else e.preventDefault()
              }}
              className={
                prevDisabled
                  ? "pointer-events-none opacity-50 select-none"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* Desktop Page Items */}
          <div className="hidden items-center gap-0.5 sm:flex">
            {getVisiblePages().map((page, idx) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={getPageUrl ? getPageUrl(page) : "#"}
                    isActive={page === currentPage}
                    onClick={(e) => handlePageClick(page, e)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
          </div>

          {/* Mobile Page Indicator */}
          <span className="px-2 text-xs font-medium text-foreground select-none sm:hidden">
            {currentPage} / {totalPages}
          </span>

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              href={
                getPageUrl
                  ? nextDisabled
                    ? "#"
                    : getPageUrl(currentPage + 1)
                  : "#"
              }
              onClick={(e) => {
                if (!nextDisabled) handlePageClick(currentPage + 1, e)
                else e.preventDefault()
              }}
              className={
                nextDisabled
                  ? "pointer-events-none opacity-50 select-none"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
