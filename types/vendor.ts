export interface Vendor {
  id: string
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  whatsappNumber: string
  school: string
  campus: string
  isActive: boolean
  isOpen: boolean
  deliveryFee: number
  prepTime?: string
  image?: string | { url: string; publicId: string }

  // Monnify integration fields
  monnifySubAccountCode?: string
  monnifyBankCode?: string
  monnifyAccountNumber?: string
  monnifyIntegrationStatus?: "pending" | "active"
  pendingWalletBalance?: number
  walletTotalDisbursed?: number
  lastBankUpdateAt?: string // ISO string

  // Computed/virtual UI properties
  initials?: string
  location?: string
  tagline?: string
  rating?: number
  ratingCount?: number
}

export interface VendorFilterItem {
  id: string
  name: string
  slug: string
  image?: { url: string; publicId: string }
}

export interface MenuItem {
  id: string
  vendorId: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | { url: string; publicId: string } | null
  isAvailable: boolean
  availableFrom: string | null
  availableTo: string | null
  prepTimeValue: number | null
  prepTimeUnit: "minutes" | "hours" | "days" | null
  quantityAvailable: number | null
  availableDays: string[]
  isPreorder?: boolean
  preorderEndDate?: string | Date
  preorderDeliveryInfo?: string
  createdAt: string
  updatedAt: string

  // Fabricated UI properties
  isAvailableNow?: boolean
  vendorName?: string
  vendorSlug?: string
  vendorIsActive?: boolean
  vendorWhatsappNumber?: string
  vendorDeliveryFee?: number
  vendorPrepTime?: string
  tag?: string | null
  rating?: number
  ratingCount?: number
}

export type MenuItemPayload = Omit<
  MenuItem,
  "id" | "vendorId" | "vendorName" | "createdAt" | "updatedAt"
>

export interface VendorSession {
  vendorId: string
  vendorName: string
  vendorPhone: string
}

export interface SubLandmark {
  id: string
  name: string
  fee: number
}

export interface Feedback {
  id: string
  rating: number
  isAnonymous?: boolean
  itemReviews?: Array<{
    id: string
    menuItemName: string
    rating: number
    title?: string
    comments?: string
  }>
  orderId?: string
  createdAt: string
}

export interface DeliverySettingsResponse {
  landmarks: {
    id: string
    school: string
    campus: string
    name: string
    defaultDeliveryFee: number
    subLandmarks: {
      id: string
      name: string
      defaultDeliveryFee?: number
    }[]
  }[]
  overrides: {
    landmarks: { landmarkId: string; fee: number }[]
    subLandmarks: { subLandmarkId: string; fee: number }[]
  }
}

export interface VendorFeeResponse {
  prepTime: string
  monnifySubaccountCode: string
}

export interface VendorStats {
  totalOrders: number
  todayOrders: number
  pending: number
  inProgress: number
  totalCompleted: number
  totalRevenue: number
  hasPaymentDetails?: boolean
  slug?: string
  acceptedTermsVersion?: string
  isNewcomer?: boolean
  monnifyDisbursed?: number
  monnifyPending?: number
}

export interface VendorWithMenu extends Vendor {
  itemCount?: number
  avgRating?: number
}

export interface DashboardStats {
  totalVendors: number
  activeVendors: number
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  byStatus: Record<string, number>
}

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  subLandmarks: { id: string; name: string; fee: number }[]
}

export interface MonnifySubAccount {
  subAccountCode: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  defaultSplitPercentage?: number
}

export interface ItemFeedbackUI {
  id: string
  menuItemName: string
  rating: number
  title?: string
  comments?: string
}

export interface DeliveryZonesResponse {
  vendorCampus: string
  vendorSchool: string
  zones: DeliveryZone[]
}

export interface VendorReview {
  id: string
  rating: number
  comments?: string
  createdAt: string
  isAnonymous: boolean
  customerName: string
  customerImage?: string
}

export interface RatingStatisticsData {
  averageRating: number
  totalReviews: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
