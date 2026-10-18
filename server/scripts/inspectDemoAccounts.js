import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

dotenv.config();

/**
 * Read-Only MongoDB Demo-Account Inspection Script
 * 
 * Safely inspects MongoDB Atlas for demo accounts ending in @codetogether.dev
 * or named Petros, Habtu, or Mekdes.
 * 
 * Does NOT modify or delete any records.
 * NEVER prints passwords, hashes, or secrets.
 */
async function inspectDemoAccounts() {
  const mongoUri = process.argv[2] || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('Error: MONGODB_URI is required.');
    console.log('Usage: node scripts/inspectDemoAccounts.js "<MONGODB_URI>"');
    console.log('Or ensure MONGODB_URI is set in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB in READ-ONLY mode...');
  try {
    await mongoose.connect(mongoUri, {
      readPreference: 'secondaryPreferred', // Safe read preference
    });
    console.log('Successfully connected to MongoDB Atlas.\n');

    const totalUsersCount = await User.countDocuments();
    const totalRoomsCount = await Room.countDocuments();
    const totalMessagesCount = await Message.countDocuments();

    console.log('--- Database Overview ---');
    console.log(`Total User accounts:    ${totalUsersCount}`);
    console.log(`Total Rooms:            ${totalRoomsCount}`);
    console.log(`Total Chat Messages:    ${totalMessagesCount}\n`);

    // Target demo accounts
    const demoQuery = {
      $or: [
        { email: { $regex: /@codetogether\.dev$/i } },
        { username: { $in: ['Petros', 'Habtu', 'Mekdes'] } },
      ],
    };

    const suspectedDemoUsers = await User.find(demoQuery)
      .select('_id username email authProvider createdAt updatedAt')
      .lean();

    console.log(`--- Suspected Demo Accounts Found: ${suspectedDemoUsers.length} ---`);

    if (suspectedDemoUsers.length === 0) {
      console.log('No @codetogether.dev or demo-named accounts exist in the database.');
      console.log('The database is already clean of legacy demo identities.');
    } else {
      for (const [index, user] of suspectedDemoUsers.entries()) {
        const roomsCreated = await Room.find({ creator: user.username }).select('name').lean();
        const messageCount = await Message.countDocuments({ sender: user.username });

        const isDefiniteDemo = user.email.toLowerCase().endsWith('@codetogether.dev');

        console.log(`\n[Account #${index + 1}]`);
        console.log(`ID:            ${user._id}`);
        console.log(`Username:      ${user.username}`);
        console.log(`Email:         ${user.email}`);
        console.log(`Provider:      ${user.authProvider || 'local'}`);
        console.log(`Created At:    ${user.createdAt}`);
        console.log(`Confirmed Demo:${isDefiniteDemo ? ' YES (@codetogether.dev)' : ' UNCERTAIN (Check before deletion)'}`);
        console.log(`Associated Rooms (${roomsCreated.length}): ${roomsCreated.map(r => r.name).join(', ') || 'None'}`);
        console.log(`Associated Messages:     ${messageCount}`);
      }
    }

    console.log('\n============================================================');
    console.log('Inspection complete. No records were modified or deleted.');
    console.log('Awaiting explicit user approval before any cleanup action.');
    console.log('============================================================');
  } catch (err) {
    console.error('Failed to inspect database:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

inspectDemoAccounts();
