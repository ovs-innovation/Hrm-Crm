import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    size: { type: Number },
    relatedTo: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    category: { type: String, default: 'General' },
    uploadedBy: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
