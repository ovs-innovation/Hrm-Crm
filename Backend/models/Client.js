import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Lead', 'Active', 'Inactive'],
      default: 'Lead',
    },
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

tenantScoped(clientSchema);
clientSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const Client = mongoose.model('Client', clientSchema);

export default Client;
