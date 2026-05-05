import dbConnect from "../lib/db";
import MenuItem from "../models/MenuItem";

async function fixBrokenImages() {
  await dbConnect();
  
  const broken1 = "https://images.unsplash.com/photo-1612392062798-c3799b4f4d3c?w=600&h=450&fit=crop&auto=format";
  const fixed1 = "https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=600&h=450&fit=crop&auto=format"; // Burger/Sandwich
  
  const broken2 = "https://images.unsplash.com/photo-1544025162-d76538780ef?w=600&h=450&fit=crop&auto=format";
  const fixed2 = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop&auto=format"; // Skewers

  await MenuItem.updateMany({ image: broken1 }, { $set: { image: fixed1 } });
  await MenuItem.updateMany({ image: broken2 }, { $set: { image: fixed2 } });
  
  console.log("Fixed broken images in DB!");
  process.exit(0);
}

fixBrokenImages().catch(console.error);
