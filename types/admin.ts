export interface AnalyticsData {
  kpis: {
    totalOrders: number
    totalGMV: number
    totalProfit: number
    aov: number
    completionRate: number
    cancellationRate: number
    growth: {
      orders: number
      gmv: number
      profit: number
      aov: number
    }
  }
  chartData: Array<{
    date: string
    orders: number
    gmv: number
    profit: number
  }>
  revenueByDow: Array<{
    day: string
    gmv: number
    orders: number
  }>
  paymentSplit: {
    monnify: number
    wallet: number
  }
  overview: {
    totalVendors: number
    activeVendors: number
    newVendors: number
    totalCustomers: number
    newCustomers: number
    repeatOrders: number
    guestOrders: number
  }
  topVendors: Array<{
    id: string
    name: string
    gmv: number
    vendorRevenue: number
    ordersCount: number
  }>
  topZones: Array<{
    zone: string
    orders: number
  }>
}

export interface SubLandmark {
  id: string
  name: string
  defaultDeliveryFee?: number
  isActive: boolean
}

export interface Landmark {
  id: string
  school: string
  campus: string
  name: string
  defaultDeliveryFee: number
  isActive: boolean
  subLandmarks: SubLandmark[]
}

export interface AdminStaff {
  _id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "vendor_manager"
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface AdminOrder {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  vendorWhatsappNumber: string
  items: Array<{
    menuItemId: string
    name: string
    price: number
    quantity: number
  }>
  customerName: string
  customerEmail: string
  customerPhone: string
  location: string
  notes?: string
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

export interface OrdersResponse {
  orders: AdminOrder[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export interface AdminStats {
  totalVendors: number
  activeVendors: number
  vendorsWithoutMenus: number
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  confirmedOrders: number
  preparingOrders: number
  completedOrders: number
  cancelledOrders: number
  grossVolume: number
  platformProfit: number
  monnifyBalance: number | null
  allTimePlatformProfit: number
  totalWithdrawn: number
  remainingProfit: number
  totalCustomerWalletLiabilities: number
  totalPendingVendorWallet: number
  totalVendorWalletDisbursed: number
}

export interface VendorAccount {
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminVendor {
  id: string
  name: string
  slug: string
  description: string
  category: string
  whatsappNumber: string
  campus: string
  isActive: boolean
  isFeatured: boolean
  hasMenu: boolean
  createdAt: string
  image?: { url: string; publicId: string }
  account: VendorAccount | null
  monnifyIntegrationStatus?: "pending" | "active" | "failed" | string
  onboardedByName?: string
  isManagedByBiteHub?: boolean
  pendingWalletBalance?: number
  monnifyBankCode?: string
  monnifyAccountNumber?: string
}

export interface AnalyticsKPIs {
  totalOrders: number
  totalGMV: number
  totalProfit: number
}

export interface AnalyticsPrevAgg {
  kpis: AnalyticsKPIs[]
}

export interface AnalyticsTimeSeriesItem {
  _id: string
  orders: number
  gmv: number
  profit: number
  firstDate: string | Date
}

export interface AnalyticsDowItem {
  _id: number
  orders: number
  gmv: number
}

export interface AnalyticsTopVendorItem {
  _id: string
  vendorName: string
  gmv: number
  vendorRevenue: number
  ordersCount: number
}

export interface AnalyticsTopZoneItem {
  _id: string
  orders: number
}
