import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

/**
 * Selective Demo Account Cleanup Script
 * 
 * SAFETY RULES:
 * 1. ONLY executes when --confirm flag is provided.
 * 2. ONLY deletes explicitly confirmed demo accounts ending in @codetogether.dev.
 * 3. NEVER performs collection-wide resets or drops.
 * 4. Preserves all legitimate user accounts, rooms, files, and chat records.
 */
async function cleanupDemoAccounts() {
  const args = process.argv.slice(2);
  const hasConfirm = args.includes('--confirm');
  const mongoUri = args.find((a) => !a.startsWith('--')) || process.env.MONGODB_URI;

  if (!hasConfirm) {
    console.error('SAFETY BLOCK: Missing --confirm flag.');
    console.log('You must run with --confirm after reviewing the inspection report.');
    console.log('Usage: node scripts/cleanupDemoAccounts.js "<MONGODB_URI>" --confirm');
    process.exit(1);
  }

  if (!mongoUri) {
    console.error('Error: MONGODB_URI is required.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas for selective demo cleanup...');
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected.\n');

    // Strict filter: only accounts explicitly with @codetogether.dev domain
    const deleteFilter = {
      email: { $regex: /@codetogether\.dev$/i },
    };

    const targets = await User.find(deleteFilter).select('_id username email').lean();

    if (targets.length === 0) {
      console.log('No @codetogether.dev demo accounts to delete. Cleanup is not needed.');
      return;
    }

    console.log(`Found ${targets.length} confirmed demo account(s) to remove:`);
    targets.forEach((t) => console.log(` - ID: ${t._id} | Username: ${t.username} | Email: ${t.email}`));

    const result = await User.deleteMany(deleteFilter);
    console.log(`\nSuccessfully removed ${result.deletedCount} demo user record(s).`);
    console.log('All legitimate accounts, rooms, files, and messages preserved.');
  } catch (err) {
    console.error('Cleanup error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

cleanupDemoAccounts();
