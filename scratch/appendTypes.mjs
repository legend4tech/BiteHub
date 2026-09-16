import fs from 'fs';
import path from 'path';

const basePath = '/home/legend4tech/Documents/BiteHub';

// 1. Append types
const adminTypesPath = path.join(basePath, 'types/admin.ts');
const newTypes = `
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
}
`;
fs.appendFileSync(adminTypesPath, newTypes);
console.log('Appended to types/admin.ts');

// 2. Update imports
const filesToUpdate = [
  'app/admin/(dashboard)/vendors/page.tsx',
  'app/vendor-manager/(dashboard)/vendors/page.tsx',
  'hooks/admin/useAdminVendors.ts',
  'hooks/admin/useAdminStats.ts',
  'components/vendor-manager/VendorManagerOverview.tsx'
];

for (const f of filesToUpdate) {
  const fPath = path.join(basePath, f);
  let content = fs.readFileSync(fPath, 'utf8');
  content = content.replace(/from "@\/components\/admin\/types"/g, 'from "@/types/admin"');
  fs.writeFileSync(fPath, content);
  console.log('Updated ' + f);
}

// 3. Delete components/admin/types.ts
const compTypesPath = path.join(basePath, 'components/admin/types.ts');
if (fs.existsSync(compTypesPath)) {
  fs.unlinkSync(compTypesPath);
  console.log('Deleted components/admin/types.ts');
}
