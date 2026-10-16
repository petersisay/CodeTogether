import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    onlineCount: {
      type: Number,
      default: 0,
    },
    dotColor: {
      type: String,
      default: 'bg-emerald-400',
    },
    files: [
      {
        filename: String,
        content: String,
        language: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Room || mongoose.model('Room', roomSchema);
