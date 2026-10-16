import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[MongoDB] Notice: MONGODB_URI not provided. Server will run with in-memory persistence fallback.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to Atlas: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Connection failed: ${error.message}. Running with in-memory fallback.`);
    return false;
  }
}
