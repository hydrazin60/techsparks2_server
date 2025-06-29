import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Normalize database name to lowercase to prevent case sensitivity issues
const normalizeDbName = (connectionString: string): string => {
  try {
    const url = new URL(connectionString);
    const dbName = url.pathname.substring(1); // Remove leading slash
    url.pathname = `/${dbName.toLowerCase()}`; // Force lowercase
    return url.toString();
  } catch (error) {
    console.error("Invalid MongoDB connection URL:", connectionString);
    throw new Error("Invalid MongoDB connection URL format");
  }
};

export const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      // Only connect if not already connected
      const normalizedUrl = normalizeDbName(process.env.MONGO_URL as string);
      
      await mongoose.connect(normalizedUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true
      });
      
      console.log("✅ MongoDB connected successfully");
      
      // Type-safe database name verification
      if (mongoose.connection.db) {
        const actualDbName = mongoose.connection.db.databaseName;
        console.log(`🔍 Using database: ${actualDbName}`);
      } else {
        console.warn("⚠️ Database instance not available on connection object");
      }
    }
  } catch (error: any) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // Provide more specific error message for case sensitivity issues
    if (error.message.includes('different case')) {
      console.error('\n⚠️ Database name case mismatch detected!');
      console.error('Solution: Use consistent lowercase for database names in:');
      console.error('1. Your MONGO_URL environment variable');
      console.error('2. Any direct database references in your code\n');
    }
    
    throw error;
  }
};