import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: 'developer',
    },
    avatar: {
      type: String,
      default: '/assets/avatar-petros.png',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'online',
    },
    activity: {
      type: String,
      default: 'Editing App.jsx',
    },
    currentRoom: {
      type: String,
      default: 'ASTU_DreamTeam',
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
