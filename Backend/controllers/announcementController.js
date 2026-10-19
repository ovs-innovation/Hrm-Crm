import Announcement from '../models/Announcement.js';
import Employee from '../models/Employee.js';
import { notifyMany } from '../utils/notify.js';
import { sendEmail, announcementEmailHtml } from '../utils/emailService.js';

const asAnnouncementDate = (value) => {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T12:00:00+05:30`);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(200);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishAnnouncement = async ({ title, description, type = 'General', date }) => {
  const cleanTitle = String(title || '').trim().slice(0, 160);
  const cleanDescription = String(description || '').trim().slice(0, 4000);
  if (!cleanTitle || !cleanDescription) {
    const err = new Error('Title and message are required.');
    err.status = 400;
    throw err;
  }
  const announcement = await Announcement.create({
    title: cleanTitle,
    description: cleanDescription,
    type: ['General', 'Urgent', 'Event'].includes(type) ? type : 'General',
    date: asAnnouncementDate(date),
  });
  const employees = await Employee.find().select('_id email');
  await notifyMany(employees.map((employee) => employee._id), {
    userType: 'Employee',
    title: announcement.title,
    message: announcement.description.slice(0, 180),
    link: '/policies',
    module: 'hrm',
  }).catch(() => {});
  const emailNotice = await emailAnnouncement(announcement, employees);
  return { announcement, emailNotice };
};

export const createAnnouncement = async (req, res) => {
  try {
    const { announcement, emailNotice } = await publishAnnouncement(req.body);
    res.status(201).json({ ...announcement.toObject(), emailNotice });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Public (Admin only later)
const emailAnnouncement = async (announcement, employees) => {
  const emails = [...new Set(
    employees
      .map((employee) => String(employee.email || '').trim().toLowerCase())
      .filter((email) => email.includes('@'))
  )];
  if (!emails.length) return 'Published on the portal. No employee email addresses were found.';
  if (!process.env.SMTP_HOST) {
    return 'Published on the portal. Email is not set up on the server, so inboxes were not mailed.';
  }
  const html = announcementEmailHtml(announcement.title, announcement.description, announcement.type);
  const subject = `${announcement.type}: ${announcement.title}`;
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < emails.length; index += 10) {
    const chunk = emails.slice(index, index + 10);
    const results = await Promise.all(chunk.map(async (to) => {
      try {
        await sendEmail({ to, subject, html, text: announcement.description });
        return true;
      } catch {
        return false;
      }
    }));
    sent += results.filter(Boolean).length;
    failed += results.length - results.filter(Boolean).length;
  }
  if (!sent) return 'Published on the portal, but the email server rejected the message.';
  if (failed) return `Published and emailed ${sent} people. ${failed} addresses failed.`;
  return `Published and emailed ${sent} people.`;
};

export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    Object.assign(announcement, req.body);
    const updated = await announcement.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
