import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'CodeTogether',
    },
    workspaceName: {
      type: String,
      required: true,
      default: 'ASTU_DreamTeam',
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

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
