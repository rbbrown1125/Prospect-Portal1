import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("❌ Invalid stored password format");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

async function testLogin() {
  console.log("🔍 Testing login for admin@godlan.com / Admin123!");
  
  try {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.email, 'admin@godlan.com'));
    
    if (!user) {
      console.log("❌ User not found in database!");
      return;
    }
    
    console.log("✅ User found:", {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordLength: user.password.length
    });
    
    // Test password comparison
    const isValidPassword = await comparePasswords('Admin123!', user.password);
    
    if (isValidPassword) {
      console.log("✅ Password validation successful!");
    } else {
      console.log("❌ Password validation failed!");
      
      // Let's test if we can create a new hash and compare it
      console.log("\n🔧 Debugging password hashing...");
      const salt = randomBytes(16).toString("hex");
      const newHash = (await scryptAsync('Admin123!', salt, 64)) as Buffer;
      const testPassword = `${newHash.toString("hex")}.${salt}`;
      
      console.log("New hash format valid:", testPassword.includes('.'));
      console.log("Testing new hash:", await comparePasswords('Admin123!', testPassword));
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit();
  }
}

testLogin();