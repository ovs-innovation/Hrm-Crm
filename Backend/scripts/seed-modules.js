import 'dotenv/config';
import connectDB from '../config/db.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import JobPosting from '../models/JobPosting.js';

const departments = [
  { name: 'Engineering', head: 'Sarah Smith', status: 'Active' },
  { name: 'Human Resources', head: 'Mike Johnson', status: 'Active' },
  { name: 'Marketing', head: 'Emily Davis', status: 'Active' },
  { name: 'Finance', head: 'Robert Wilson', status: 'Active' },
];

const designations = [
  { title: 'Software Engineer', department: 'Engineering', level: 'Mid', status: 'Active' },
  { title: 'Senior Software Engineer', department: 'Engineering', level: 'Senior', status: 'Active' },
  { title: 'HR Manager', department: 'Human Resources', level: 'Manager', status: 'Active' },
  { title: 'Marketing Specialist', department: 'Marketing', level: 'Junior', status: 'Active' },
];

const jobs = [
  {
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    description: 'Build and maintain Vastora HRM/CRM platform.',
    requirements: 'React, Node.js, MongoDB — 2+ years experience',
    status: 'Open',
  },
  {
    title: 'HR Executive',
    department: 'Human Resources',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    description: 'Handle recruitment, onboarding, and employee relations.',
    status: 'Open',
  },
];

async function seed() {
  await connectDB();

  for (const dept of departments) {
    await Department.findOneAndUpdate({ name: dept.name }, dept, { upsert: true, new: true });
  }
  console.log(`Seeded ${departments.length} departments`);

  for (const desig of designations) {
    await Designation.findOneAndUpdate({ title: desig.title, department: desig.department }, desig, {
      upsert: true,
      new: true,
    });
  }
  console.log(`Seeded ${designations.length} designations`);

  for (const job of jobs) {
    await JobPosting.findOneAndUpdate({ title: job.title }, job, { upsert: true, new: true });
  }
  console.log(`Seeded ${jobs.length} job postings`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
