import { vendors, menuItems } from "../lib/data";
import dbConnect from "../lib/db";
import Vendor from "../models/Vendor";
import MenuItem from "../models/MenuItem";
import mongoose from "mongoose";

async function seed() {
  try {
    await dbConnect();
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await Vendor.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("Cleared existing collections.");

    // vendorMap: maps original string id (e.g. "vendor-1") → real ObjectId
    // This is used so menu items can reference the correct vendor _id
    const vendorMap = new Map<string, mongoose.Types.ObjectId>();

    // Multiply vendors to get at least 40
    let vendorCount = 1;
    for (let i = 0; i < 10; i++) {
      for (const v of vendors) {
        const newObjectId = new mongoose.Types.ObjectId();

        const newVendor = new Vendor({
          ...v,
          // Override _id with a fresh ObjectId — we do NOT use the string
          // ids from the mock data (like "vendor-1") as _id because Mongoose
          // expects ObjectId and storing a plain string would break all
          // aggregations and $lookup queries.
          _id: newObjectId,
          name: `${v.name} ${vendorCount}`,
          slug: `${v.slug}-${vendorCount}`,
        });

        await newVendor.save();

        // Only map the FIRST iteration — these are the vendors whose
        // original string ids appear in the menuItems mock data.
        // Vendors created in iterations 2–10 are duplicates for bulk
        // data and don't need a menu item mapping.
        if (i === 0) {
          vendorMap.set(v.id, newObjectId);
        }

        vendorCount++;
      }
    }
    console.log(`Saved ${vendorCount - 1} Vendors`);

    // Multiply items to get at least 60
    let itemCount = 1;
    for (let i = 0; i < 5; i++) {
      for (const m of menuItems) {
        // Look up the real ObjectId for this item's vendor.
        // If for any reason the mapping is missing, we skip the item
        // rather than silently storing a broken string id.
        const mappedVendorId = vendorMap.get(m.vendorId);

        if (!mappedVendorId) {
          console.warn(
            `⚠️  Skipping item "${m.name}" — no vendor mapping found for vendorId "${m.vendorId}"`
          );
          continue;
        }

        const newMenuItem = new MenuItem({
          ...m,
          _id: new mongoose.Types.ObjectId(),
          name: `${m.name} ${itemCount}`,
          // Store as ObjectId, NOT as a string.
          // This is the key fix — the model now declares vendorId as
          // Schema.Types.ObjectId, so we pass the real ObjectId here.
          vendorId: mappedVendorId,
        });

        await newMenuItem.save();
        itemCount++;
      }
    }
    console.log(`Saved ${itemCount - 1} MenuItems`);

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();