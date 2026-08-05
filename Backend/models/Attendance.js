import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  checkIn: {
    type: String, // HH:MM AM/PM
    default: null
  },
  checkOut: {
    type: String, // HH:MM AM/PM
    default: null
  },
  status: {
    type: String,
    required: true, // e.g., 'Present (Active)', 'Late (Active)', 'Completed', 'Late (Completed)'
  },
  workMode: {
    type: String,
    enum: ['Office', 'Home', 'Field'],
    required: true
  },
  // Optional GPS fields for geofence checks (when client provides them)
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  distanceFromOffice: { type: Number, default: null },
}, {
  timestamps: true
});

attendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

tenantScoped(attendanceSchema);

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
