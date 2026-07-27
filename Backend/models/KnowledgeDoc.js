import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  pageNumber: { type: Number },
  metadata: { type: Map, of: String, default: {} }
});

const knowledgeDocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileName: { type: String },
    category: { type: String, default: 'Policy' },
    chunks: [chunkSchema],
  },
  { timestamps: true }
);

const KnowledgeDoc = mongoose.model('KnowledgeDoc', knowledgeDocSchema);
export default KnowledgeDoc;
