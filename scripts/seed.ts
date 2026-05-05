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

    // The current mock data uses string ids like 'vendor-1' and 'item-1'.
    // To minimize breaking changes on the frontend, we will let Mongoose generate ObjectIds 
    // for _id, but we'll override the string ids for the seeded data just so relations keep working, 
    // or we can just use the exact strings from mock data as `_id`. 
    // Wait, Mongoose models default to ObjectId. Let's just insert them as they are and remap.

    const vendorMap = new Map();

    // Multiply vendors to get at least 40
    let vendorCount = 1;
    for (let i = 0; i < 10; i++) {
      for (const v of vendors) {
        const newVendor = new Vendor({
          ...v,
          name: `${v.name} ${vendorCount}`,
          slug: `${v.slug}-${vendorCount}`,
          _id: new mongoose.Types.ObjectId(),
        });
        await newVendor.save();
        
        // Only map the original IDs for the first iteration so items map correctly to at least the first batch
        if (i === 0) {
          vendorMap.set(v.id, newVendor._id.toString());
        }
        
        vendorCount++;
      }
    }
    console.log(`Saved ${vendorCount - 1} Vendors`);

    // Multiply items to get at least 60
    let itemCount = 1;
    for (let i = 0; i < 5; i++) {
      for (const m of menuItems) {
        const newMenuItem = new MenuItem({
          ...m,
          name: `${m.name} ${itemCount}`,
          vendorId: vendorMap.get(m.vendorId) || m.vendorId, // Use mapped ObjectId
          _id: new mongoose.Types.ObjectId(),
        });
        await newMenuItem.save();
        itemCount++;
      }
    }
    console.log(`Saved ${itemCount - 1} MenuItems`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
