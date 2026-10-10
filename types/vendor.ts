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
  receivesMarketing?: boolean
  defaultDeliveryFeeInKobo: number
  prepTime?: string
  image?: string | { url: string; publicId: string }

  // Monnify integration fields
  monnifySubAccountCode?: string
  monnifyBankCode?: string
  monnifyAccountNumber?: string
  monnifyIntegrationStatus?: "pending" | "active"
  pendingWalletBalanceInKobo?: number
  walletTotalDisbursedInKobo?: number
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
  priceInKobo: number
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
  vendorDeliveryFeeInKobo?: number
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
  feeInKobo: number
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
    defaultDeliveryFeeInKobo: number
    subLandmarks: {
      id: string
      name: string
      defaultDeliveryFeeInKobo?: number
    }[]
  }[]
  overrides: {
    landmarks: { landmarkId: string; feeInKobo: number }[]
    subLandmarks: { subLandmarkId: string; feeInKobo: number }[]
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
  totalRevenueInKobo: number
  hasPaymentDetails?: boolean
  slug?: string
  acceptedTermsVersion?: string
  isNewcomer?: boolean
  monnifyDisbursedInKobo?: number
  monnifyPendingInKobo?: number
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
  feeInKobo: number
  subLandmarks: { id: string; name: string; feeInKobo: number }[]
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
