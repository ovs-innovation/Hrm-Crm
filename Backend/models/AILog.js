import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    response: { type: String },
    latencyMs: { type: Number, default: 0 },
    tokensCount: { type: Number, default: 0 },
    costUSD: { type: Number, default: 0.0 },
    module: { type: String, required: true }, // e.g. 'CRM', 'HRM', 'RAG'
    user: { type: String, default: 'System' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },

    // Extended attributes for diagnostics & providers auditing
    provider: { type: String, default: 'gemini' },
    model: { type: String },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
    errorMessage: { type: String },
    correlationId: { type: String, index: true }
  },
  { timestamps: true }
);

const AILog = mongoose.model('AILog', aiLogSchema);
export default AILog;
