import type { Vendor, MenuItem } from "./types";

// ─── Vendors ──────────────────────────────────────────────────────────────────

export const vendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Mama Nkechi's Kitchen",
    slug: "mama-nkechis-kitchen",
    description: "Authentic Igbo home cooking, served fresh every day.",
    category: "local",
    tags: ["rice", "swallow", "soup"],
    whatsappNumber: "2348012345678",
    school: "COOU",
    campus: "Uli",
    isActive: true,
  },
  {
    id: "vendor-2",
    name: "Spice Palace",
    slug: "spice-palace",
    description: "Nigerian street food with bold, unforgettable flavours.",
    category: "snacks",
    tags: ["shawarma", "snacks", "drinks"],
    whatsappNumber: "2347081056999",
    school: "COOU",
    campus: "Uli",
    isActive: true,
  },
  {
    id: "vendor-3",
    name: "Fresh Kitchen",
    slug: "fresh-kitchen",
    description: "Light, healthy meals for the health-conscious student.",
    category: "healthy",
    tags: ["fruits", "drinks", "smoothies"],
    whatsappNumber: "2348034567890",
    school: "COOU",
    campus: "Uli",
    isActive: true,
  },
  {
    id: "vendor-4",
    name: "Grill Station",
    slug: "grill-station",
    description: "Suya, peppered chicken and smoky grills on demand.",
    category: "grills",
    tags: ["suya", "chicken", "grills"],
    whatsappNumber: "2348045678901",
    school: "COOU",
    campus: "Uli",
    isActive: true,
  },
];

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const menuItems: MenuItem[] = [
  // Mama Nkechi's Kitchen
  {
    id: "item-1",
    vendorId: "vendor-1",
    name: "Smoky Jollof Rice & Chicken",
    description: "Perfectly seasoned party jollof with a whole chicken piece.",
    price: 1200,
    category: "rice",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-2",
    vendorId: "vendor-1",
    name: "Egusi Soup & Pounded Yam",
    description: "Rich egusi soup with assorted meat and smooth pounded yam.",
    price: 1500,
    category: "soup",
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-3",
    vendorId: "vendor-1",
    name: "Ofada Rice & Ayamase Stew",
    description: "Local Ofada rice with spicy green pepper stew.",
    price: 1400,
    category: "rice",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-4",
    vendorId: "vendor-1",
    name: "Ofe Akwu & White Rice",
    description: "Palm nut soup with assorted fish and tender white rice.",
    price: 1300,
    category: "soup",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-5",
    vendorId: "vendor-1",
    name: "Eba & Vegetable Soup",
    description: "Smooth eba with fresh vegetable soup and stockfish.",
    price: 1000,
    category: "soup",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },

  // Spice Palace
  {
    id: "item-6",
    vendorId: "vendor-2",
    name: "Beef Shawarma Special",
    description: "Juicy beef shawarma with coleslaw, sauce and fries inside.",
    price: 900,
    category: "shawarma",
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-7",
    vendorId: "vendor-2",
    name: "Pepper Suya Sticks",
    description: "Classic suya seasoned with yaji spice, served with onions.",
    price: 700,
    category: "protein",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-8",
    vendorId: "vendor-2",
    name: "Fried Rice & Chicken Wings",
    description: "Flavourful fried rice with crispy spiced chicken wings.",
    price: 1300,
    category: "rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-9",
    vendorId: "vendor-2",
    name: "Puff Puff (6 pieces)",
    description: "Soft, golden deep-fried dough balls lightly sweetened.",
    price: 200,
    category: "snack",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-10",
    vendorId: "vendor-2",
    name: "Peppered Gizzard",
    description: "Well-cooked gizzard in a rich tomato and pepper sauce.",
    price: 900,
    category: "protein",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },

  // Fresh Kitchen
  {
    id: "item-11",
    vendorId: "vendor-3",
    name: "Fried Plantain & Egg Sauce",
    description: "Sweet ripe plantain with a savoury egg and tomato sauce.",
    price: 800,
    category: "snack",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-12",
    vendorId: "vendor-3",
    name: "Tropical Fruit Smoothie",
    description: "Blended mango, pineapple and banana — no added sugar.",
    price: 600,
    category: "drink",
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-13",
    vendorId: "vendor-3",
    name: "Chapman Drink",
    description: "Refreshing Nigerian Chapman served chilled with fruits.",
    price: 500,
    category: "drink",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-14",
    vendorId: "vendor-3",
    name: "Indomie Noodles (Special)",
    description: "Indomie cooked with egg, vegetables and seasoned chicken.",
    price: 500,
    category: "snack",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-15",
    vendorId: "vendor-3",
    name: "Zobo Drink (Large)",
    description: "Chilled hibiscus drink with ginger and pineapple flavour.",
    price: 300,
    category: "drink",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },

  // Grill Station
  {
    id: "item-16",
    vendorId: "vendor-4",
    name: "Grilled Chicken (Half)",
    description: "Slow-grilled marinated chicken with peppered sauce.",
    price: 1500,
    category: "protein",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-17",
    vendorId: "vendor-4",
    name: "Chicken Shawarma",
    description: "Grilled chicken shawarma in soft flatbread with garlic sauce.",
    price: 1000,
    category: "shawarma",
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-18",
    vendorId: "vendor-4",
    name: "Peppered Grilled Fish",
    description: "Whole catfish grilled with fresh pepper and tomatoes.",
    price: 1800,
    category: "protein",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-19",
    vendorId: "vendor-4",
    name: "Hot Dog Roll",
    description: "Toasted hotdog roll with sausage, lettuce and ketchup.",
    price: 600,
    category: "snack",
    image: "https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
  {
    id: "item-20",
    vendorId: "vendor-4",
    name: "Beef Kebab Skewers",
    description: "Marinated beef cubes grilled on skewers with peppers.",
    price: 1100,
    category: "protein",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop&auto=format",
    isAvailable: true,
  },
];

// ─── Landing page category chips ──────────────────────────────────────────────

export const categories = [
  { name: "Rice dishes", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop" },
  { name: "Soups", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop" },
  { name: "Snacks", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop" },
  { name: "Drinks", image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=400&fit=crop" },
  { name: "Shawarma", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=400&fit=crop" },
  { name: "Proteins", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getVendorById(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id);
}

export function getMenuByVendor(vendorId: string): MenuItem[] {
  return menuItems.filter((m) => m.vendorId === vendorId);
}

export function getAvailableMenuByVendor(vendorId: string): MenuItem[] {
  return menuItems.filter((m) => m.vendorId === vendorId && m.isAvailable);
}
