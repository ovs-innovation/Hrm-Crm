import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const channelSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    target: { type: String, default: '' }, // email / webhook url / chat id (encrypted when secret)
  },
  { _id: false }
);

const infraSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'default' },
    pollingIntervalSec: { type: Number, default: 60, min: 15, max: 3600 },
    websiteCheckIntervalSec: { type: Number, default: 60, min: 30, max: 3600 },
    serverMetricsIntervalSec: { type: Number, default: 60, min: 30, max: 3600 },
    sslCheckCronHour: { type: Number, default: 3, min: 0, max: 23 },
    domainCheckCronHour: { type: Number, default: 4, min: 0, max: 23 },
    backupCheckIntervalSec: { type: Number, default: 3600, min: 300, max: 86400 },
    logRetentionDays: { type: Number, default: 30, min: 7, max: 365 },
    metricRetentionDays: { type: Number, default: 30, min: 7, max: 90 },
    cpuAlertThreshold: { type: Number, default: 85 },
    ramAlertThreshold: { type: Number, default: 90 },
    diskAlertThreshold: { type: Number, default: 90 },
    slowResponseMs: { type: Number, default: 1500 },
    provider: {
      type: String,
      enum: ['local', 'hostinger', 'aws', 'azure', 'digitalocean', 'hetzner', 'contabo'],
      default: 'local',
    },
    /** Encrypted provider API token — never returned plaintext */
    providerApiTokenEnc: { type: String, default: '' },
    agentIngestTokenEnc: { type: String, default: '' },
    notifications: {
      email: { type: channelSchema, default: () => ({}) },
      whatsapp: { type: channelSchema, default: () => ({}) },
      slack: { type: channelSchema, default: () => ({}) },
      telegram: { type: channelSchema, default: () => ({}) },
      webhook: { type: channelSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

tenantScoped(infraSettingsSchema);
infraSettingsSchema.index({ tenantId: 1, singleton: 1 }, { unique: true });

export default mongoose.model('InfraSettings', infraSettingsSchema);
