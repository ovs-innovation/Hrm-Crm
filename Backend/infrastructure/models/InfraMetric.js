import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

/** Time-series samples for graphs. Written by jobs/agent — dashboard only reads. */
const infraMetricSchema = new mongoose.Schema(
  {
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraServer', default: null },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraWebsite', default: null },
    kind: {
      type: String,
      enum: ['cpu', 'ram', 'disk', 'network_up', 'network_down', 'bandwidth', 'load', 'response_time'],
      required: true,
    },
    value: { type: Number, required: true },
    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

tenantScoped(infraMetricSchema);
infraMetricSchema.index({ tenantId: 1, kind: 1, at: -1 });
infraMetricSchema.index({ tenantId: 1, serverId: 1, kind: 1, at: -1 });
infraMetricSchema.index({ tenantId: 1, websiteId: 1, kind: 1, at: -1 });

export default mongoose.model('InfraMetric', infraMetricSchema);
