import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Storing as YYYY-MM-DD
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Public', 'Company', 'Optional'],
    default: 'Public',
  }
}, {
  timestamps: true
});

tenantScoped(holidaySchema);

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
