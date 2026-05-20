import mongoose from "mongoose";
import crypto from "crypto";

async function test() {
  await mongoose.connect("mongodb+srv://legend4tech:a8DKoqIsMwshWh8U@cluster0.4xedp.mongodb.net/bitehub_dev");
  const token = "6b6293d684694449e169acbd8064597efd20d2c223203866d0768d1757455de3";
  const email = "legend4tech1@gmail.com";
  
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  
  const db = mongoose.connection.db;
  const user = await db.collection("vendorusers").findOne({ pendingEmail: email.toLowerCase() });
  console.log("User by email:", user ? { email: user.email, pendingEmail: user.pendingEmail, token: user.emailChangeToken } : "Not found");
  
  const userByToken = await db.collection("vendorusers").findOne({ emailChangeToken: hashedToken });
  console.log("User by token:", userByToken ? "Found" : "Not found");
  
  process.exit(0);
}
test().catch(console.error);
