import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const latestMetricsSchema = new mongoose.Schema(
  {
    cpuUsage: { type: Number, default: null },
    ramUsage: { type: Number, default: null },
    ramTotalMb: { type: Number, default: null },
    ramUsedMb: { type: Number, default: null },
    diskUsage: { type: Number, default: null },
    diskTotalGb: { type: Number, default: null },
    diskUsedGb: { type: Number, default: null },
    swapUsage: { type: Number, default: null },
    diskIoReadMbps: { type: Number, default: null },
    diskIoWriteMbps: { type: Number, default: null },
    netUploadMbps: { type: Number, default: null },
    netDownloadMbps: { type: Number, default: null },
    bandwidthUsedGb: { type: Number, default: null },
    networkRxBytes: { type: Number, default: null },
    networkTxBytes: { type: Number, default: null },
    loadAverage: { type: [Number], default: [] },
    uptimeSec: { type: Number, default: null },
    temperatureC: { type: Number, default: null },
    processesRunning: { type: Number, default: null },
    openPorts: { type: [Number], default: [] },
    source: { type: String, default: null },
    agentExtras: { type: mongoose.Schema.Types.Mixed, default: null },
    collectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const infraServerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    hostname: { type: String, default: '', trim: true },
    provider: {
      type: String,
      enum: ['local', 'hostinger', 'aws', 'azure', 'digitalocean', 'hetzner', 'contabo', 'other'],
      default: 'local',
    },
    providerRef: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    region: { type: String, default: '' },
    osVersion: { type: String, default: '' },
    kernelVersion: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded', 'unknown', 'maintenance'],
      default: 'unknown',
    },
    pollingIntervalSec: { type: Number, default: 60 },
    agentEnabled: { type: Boolean, default: true },
    /** e.g. http://10.0.0.5:9100 — backend pulls GET /metrics */
    agentBaseUrl: { type: String, default: '', trim: true },
    notes: { type: String, default: '', maxlength: 2000 },
    latestMetrics: { type: latestMetricsSchema, default: () => ({}) },
    lastCheckedAt: { type: Date, default: null },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraServerSchema);
infraServerSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model('InfraServer', infraServerSchema);
