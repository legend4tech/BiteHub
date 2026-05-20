import mongoose from "mongoose";
async function test() {
  await mongoose.connect("mongodb+srv://legend4tech:a8DKoqIsMwshWh8U@cluster0.4xedp.mongodb.net/bitehub_dev");
  const db = mongoose.connection.db;
  const users = await db.collection("vendorusers").find({ pendingEmail: { $exists: true, $ne: null } }).toArray();
  console.log("Users with pending email:");
  console.dir(users, { depth: null });
  process.exit(0);
}
test().catch(console.error);
