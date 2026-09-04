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
  deliveryFee: number
  prepTime?: string
  image?: string | { url: string; publicId: string }

  // Monnify integration fields
  monnifySubAccountCode?: string
  monnifyBankCode?: string
  monnifyAccountNumber?: string
  monnifyIntegrationStatus?: "pending" | "active"
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

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  subLandmarks: SubLandmark[]
}

export interface VendorReview {
  id: string
  rating: number
  comments?: string
  customerName: string
  createdAt: string | null
  isAnonymous: boolean
}
