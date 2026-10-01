import { Metadata } from "next"
import { CustomerList } from "@/components/admin/customers/CustomerList"

export const metadata: Metadata = {
  title: "Customers | BiteHub Admin",
  description:
    "Manage BiteHub customers, view analytics, and handle account suspensions.",
}

export default function CustomersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Customer Management
          </h2>
          <p className="mt-1 text-muted-foreground">
            Search, view, and manage customer accounts. Toggle suspensions when
            necessary.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CustomerList />
      </div>
    </div>
  )
}
