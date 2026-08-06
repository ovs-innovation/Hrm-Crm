import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const vectorEmbeddingSchema = new mongoose.Schema(
  {
    refModel: { type: String, required: true }, // e.g., 'Client', 'Document', 'Ticket', 'Employee'
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    textChunk: { type: String, required: true },
    embedding: { type: [Number], required: true } // Array of floats
  },
  { timestamps: true }
);

tenantScoped(vectorEmbeddingSchema);

const VectorEmbedding = mongoose.model('VectorEmbedding', vectorEmbeddingSchema);
export default VectorEmbedding;
