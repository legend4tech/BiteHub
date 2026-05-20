import mongoose from "mongoose";
async function test() {
  await mongoose.connect("mongodb+srv://legend4tech:a8DKoqIsMwshWh8U@cluster0.4xedp.mongodb.net/bitehub_dev");
  const db = mongoose.connection.db;
  const users = await db.collection("vendorusers").find({}).toArray();
  console.log(users.map(u => u.email));
  process.exit(0);
}
test().catch(console.error);
