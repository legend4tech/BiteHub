"use client"

import { useState } from "react"
import {
  useAdminCustomers,
  useToggleCustomerStatus,
  type CustomerData,
} from "@/hooks/admin/useAdminCustomers"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/useDebounce"
import { format } from "date-fns"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { cn } from "@/lib/utils"

function CustomerRow({
  customer,
  toggleStatusMutation,
}: {
  customer: CustomerData
  toggleStatusMutation: ReturnType<typeof useToggleCustomerStatus>
}) {
  const [localActive, setLocalActive] = useState(customer.isActive)
  const [isToggling, setIsToggling] = useState(false)
  const [prevActive, setPrevActive] = useState(customer.isActive)

  if (customer.isActive !== prevActive) {
    setPrevActive(customer.isActive)
    setLocalActive(customer.isActive)
  }

  const handleToggle = () => {
    if (isToggling) return
    const next = !localActive
    setLocalActive(next)
    setIsToggling(true)

    toggleStatusMutation.mutate(
      { id: customer.id, isActive: next },
      {
        onError: () => {
          setLocalActive(!next)
          setIsToggling(false)
        },
        onSuccess: () => {
          setIsToggling(false)
        },
      }
    )
  }

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-6 py-4">
        <p className="font-semibold">{customer.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ref: {customer.referralCode}
        </p>
      </td>
      <td className="px-6 py-4">
        <p>{customer.email}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{customer.phone}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <p>{format(new Date(customer.createdAt), "MMM d, yyyy")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {customer.lastLoginAt
            ? format(new Date(customer.lastLoginAt), "MMM d, yyyy")
            : "Never logged in"}
        </p>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <Badge
            variant={localActive ? "default" : "destructive"}
            className="mb-1"
          >
            {localActive ? "Active" : "Suspended"}
          </Badge>

          <ConfirmDialog
            trigger={
              <button
                disabled={isToggling}
                title={localActive ? "Suspend Customer" : "Unsuspend Customer"}
                className={cn(
                  "flex items-center gap-2 transition-opacity",
                  isToggling && "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    !localActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      !localActive && "translate-x-4",
                      isToggling && "scale-75"
                    )}
                  />
                </div>
                <span className="w-12 text-left text-xs font-medium text-muted-foreground">
                  {localActive ? "Suspend" : "Banned"}
                </span>
              </button>
            }
            title={localActive ? "Suspend Customer" : "Unsuspend Customer"}
            description={
              localActive
                ? "Are you sure you want to suspend this customer? They will not be able to log in."
                : "Are you sure you want to reactivate this customer's account? They will be able to log in again."
            }
            confirmText={localActive ? "Suspend" : "Unsuspend"}
            isDestructive={localActive}
            onConfirm={handleToggle}
          />
        </div>
      </td>
    </tr>
  )
}

export function CustomerList() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 500)

  const { data, isLoading, error, refetch } = useAdminCustomers(
    page,
    debouncedSearch
  )
  const toggleStatusMutation = useToggleCustomerStatus()

  const customers = data?.customers || []
  const hasData = customers.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <div className="w-full sm:w-80">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="search"
              placeholder="Search email, phone, or name..."
              className="w-full pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Joined / Last Login</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Status (Suspend)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="p-0">
                  <PageSkeleton variant="admin-list" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : error ? (
        <FetchError title="Couldn't load customers" onRetry={() => refetch()} />
      ) : !hasData ? (
        <EmptyState
          title={search ? "No matches found" : "No customers yet"}
          description={
            search
              ? "We couldn't find any customers matching your search."
              : "When users sign up, they will appear here."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">
                    Joined / Last Login
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Status (Suspend)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    toggleStatusMutation={toggleStatusMutation}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
              <span className="text-sm text-muted-foreground">
                Page {data.currentPage} of {data.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={data.currentPage === data.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
