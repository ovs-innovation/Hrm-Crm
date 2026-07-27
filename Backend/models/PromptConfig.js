import mongoose from 'mongoose';

const promptConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    version: { type: Number, default: 1 },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PromptConfig = mongoose.model('PromptConfig', promptConfigSchema);
export default PromptConfig;
