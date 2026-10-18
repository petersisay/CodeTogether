import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
