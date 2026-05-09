/**
 * Centralised serializers for Mongoose .lean() documents.
 *
 * .lean() skips toJSON transforms, so _id stays an ObjectId, virtuals are absent,
 * and sensitive fields like password can leak. These serializers enforce strict,
 * explicit mapping so the frontend always receives clean JSON matching lib/types.ts.
 */

export function serializeVendor(doc: any) {
  if (!doc) return null;

  const name: string = doc.name;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return {
    id: doc._id.toString(),
    name,
    slug: doc.slug,
    description: doc.description ?? null,
    category: doc.category ?? null,
    tags: doc.tags ?? [],
    phone: doc.phone ?? null,
    whatsappNumber: doc.whatsappNumber ?? null,
    school: doc.school ?? null,
    campus: doc.campus ?? null,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    // Virtuals
    initials,
    tagline: doc.description ?? "The best food on campus",
    location: doc.campus ?? "Main Campus",
  };
}

export function serializeMenuItem(doc: any) {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    vendorId: doc.vendorId.toString(),
    name: doc.name,
    description: doc.description ?? null,
    price: doc.price,
    category: doc.category,
    image: doc.image ?? null,
    isAvailable: doc.isAvailable,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    // vendorName, vendorWhatsappNumber, tag — merged at route level
  };
}

export function serializeOrder(doc: any) {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    vendorId: doc.vendorId.toString(),
    vendorName: doc.vendorName,
    vendorWhatsappNumber: doc.vendorWhatsappNumber,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    items: doc.items.map((item: any) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    notes: doc.notes ?? null,
    totalAmount: doc.totalAmount,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}