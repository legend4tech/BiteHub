import mongoose from "mongoose";
async function test() {
  await mongoose.connect("mongodb+srv://legend4tech:a8DKoqIsMwshWh8U@cluster0.4xedp.mongodb.net/bitehub_dev");
  const db = mongoose.connection.db;
  const user = await db.collection("vendorusers").findOne({ email: "legend4tech1@gmail.com" });
  console.log("User by exact new email:", user ? "Found" : "Not found");
  process.exit(0);
}
test().catch(console.error);
