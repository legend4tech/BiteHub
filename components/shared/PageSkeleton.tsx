import {
  DashboardSkeleton,
  OrdersTableSkeleton,
  MenuManagementSkeleton,
  MenuItemEditSkeleton,
  PaymentDetailsSkeleton,
  VendorSettingsSkeleton,
} from "./skeletons/VendorDashboardSkeletons"

import {
  MenuItemGridSkeleton,
  VendorListSkeleton,
  VendorDetailSkeleton,
  OrderDetailSkeleton,
  MenuCardGridSkeleton,
  MenuItemDetailSkeleton,
} from "./skeletons/PublicSkeletons"

import { AuthSkeleton } from "./skeletons/AuthSkeletons"

import {
  AdminListSkeleton,
  AdminOrdersSkeleton,
  AdminOverviewStatsSkeleton,
  AdminAnalyticsDashboardSkeleton,
  AdminFeedbackSkeleton,
} from "./skeletons/AdminSkeletons"

import {
  CustomerDashboardSkeleton,
  CustomerOrdersSkeleton,
  CustomerWalletSkeleton,
  CustomerRewardsSkeleton,
  CustomerSettingsSkeleton,
} from "./skeletons/CustomerDashboardSkeletons"

// ─── PageSkeleton ─────────────────────────────────────────────────────────────
// A reusable skeleton component. Pass a variant to imitate the matching page
// layout. Optionally pass `count` to repeat card skeletons.
//
// Usage:
//   <PageSkeleton variant="menu-item-grid" count={6} />
//   <PageSkeleton variant="vendor-list" />
//   <PageSkeleton variant="order-detail" />
//   <PageSkeleton variant="dashboard" />
//   <PageSkeleton variant="orders-table" count={5} />

type SkeletonVariant =
  | "menu-item-grid"
  | "vendor-list"
  | "vendor-detail"
  | "order-detail"
  | "dashboard"
  | "orders-table"
  | "menu-management"
  | "menu-card-grid"
  | "menu-item-edit"
  | "auth"
  | "payment-details"
  | "vendor-settings"
  | "menu-item-detail"
  | "admin-list"
  | "admin-orders"
  | "admin-overview-stats"
  | "admin-analytics-dashboard"
  | "admin-feedback"
  | "customer-dashboard"
  | "customer-orders"
  | "customer-wallet"
  | "customer-rewards"
  | "customer-settings"

interface PageSkeletonProps {
  variant: SkeletonVariant
  count?: number
}

export function PageSkeleton({ variant, count = 6 }: PageSkeletonProps) {
  switch (variant) {
    case "customer-dashboard":
      return <CustomerDashboardSkeleton />
    case "customer-orders":
      return <CustomerOrdersSkeleton />
    case "customer-wallet":
      return <CustomerWalletSkeleton />
    case "customer-rewards":
      return <CustomerRewardsSkeleton />
    case "customer-settings":
      return <CustomerSettingsSkeleton />
    case "menu-item-grid":
      return <MenuItemGridSkeleton count={count} />
    case "vendor-list":
      return <VendorListSkeleton count={count} />
    case "vendor-detail":
      return <VendorDetailSkeleton />
    case "order-detail":
      return <OrderDetailSkeleton />
    case "dashboard":
      return <DashboardSkeleton />
    case "orders-table":
      return <OrdersTableSkeleton count={count} />
    case "menu-management":
      return <MenuManagementSkeleton count={count} />
    case "menu-card-grid":
      return <MenuCardGridSkeleton count={count} />
    case "menu-item-edit":
      return <MenuItemEditSkeleton />
    case "auth":
      return <AuthSkeleton />
    case "payment-details":
      return <PaymentDetailsSkeleton />
    case "vendor-settings":
      return <VendorSettingsSkeleton />
    case "menu-item-detail":
      return <MenuItemDetailSkeleton />
    case "admin-list":
      return <AdminListSkeleton count={count} />
    case "admin-orders":
      return <AdminOrdersSkeleton count={count} />
    case "admin-overview-stats":
      return <AdminOverviewStatsSkeleton count={count} />
    case "admin-analytics-dashboard":
      return <AdminAnalyticsDashboardSkeleton />
    case "admin-feedback":
      return <AdminFeedbackSkeleton count={count} />
    default:
      return null
  }
}
