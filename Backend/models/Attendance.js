import mongoose from 'mongoose';

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
  }
}, {
  timestamps: true
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
