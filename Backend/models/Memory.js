import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    content: { type: String, required: true },
    scope: { type: String, enum: ['Global', 'Sales', 'HR'], default: 'Global' },
  },
  { timestamps: true }
);

const Memory = mongoose.model('Memory', memorySchema);
export default Memory;
