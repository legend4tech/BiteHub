// ─── Core TypeScript types for CampusBites MVP ───────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type MenuCategory =
  | "rice"
  | "soup"
  | "snack"
  | "drink"
  | "protein"
  | "shawarma"
  | "food";

// ─── Vendor ──────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  phone: string;
  whatsappNumber: string;
  school: string;
  campus: string;
  isActive: boolean;
  
  // Fabricated UI properties
  initials?: string;
  location?: string;
  tagline?: string;
  password?: string;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category: string; // Made this string instead of MenuCategory enum to match user schema flexibility
  image?: string;
  isAvailable: boolean;

  // Fabricated UI properties
  vendorName?: string;
  vendorWhatsappNumber?: string; // Carried from vendor so the cart can send it with the order
  tag?: string | null;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  vendorWhatsappNumber: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  vendorId: string;
  vendorName: string;
  vendorWhatsappNumber: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  notes?: string;
  status: OrderStatus;
  total: number;
  createdAt: string; // ISO string
}

// ─── Vendor Auth Session ──────────────────────────────────────────────────────

export interface VendorSession {
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
}
