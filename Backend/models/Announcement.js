import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['General', 'Urgent', 'Event'],
    default: 'General'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

tenantScoped(announcementSchema);

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
