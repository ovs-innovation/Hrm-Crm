import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const documentAuditSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    documentTitle: { type: String },
    summary: { type: String },
    importantDates: [{ type: String }],
    risks: [
      {
        severity: { type: String, enum: ['Low', 'Medium', 'High'] },
        message: { type: String },
        reason: { type: String }
      }
    ],
    extractedData: { type: Map, of: String, default: {} }
  },
  { timestamps: true }
);

tenantScoped(documentAuditSchema);

const DocumentAudit = mongoose.model('DocumentAudit', documentAuditSchema);
export default DocumentAudit;
