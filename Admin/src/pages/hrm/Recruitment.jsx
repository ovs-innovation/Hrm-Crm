import React from 'react';
import { Card, Button } from '../../components';
import { FiPlus, FiBriefcase, FiUsers } from 'react-icons/fi';

const Recruitment = () => {
  const jobs = [
    { id: 1, title: 'Senior React Developer', department: 'Engineering', type: 'Full-Time', locations: 'Remote / NY', status: 'Active', candidates: 14 },
    { id: 2, title: 'HR Coordinator', department: 'Human Resources', type: 'Full-Time', locations: 'London', status: 'Active', candidates: 8 },
    { id: 3, title: 'Product UI/UX Designer', department: 'Design', type: 'Contract', locations: 'Remote', status: 'Closed', candidates: 25 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Recruitment & Job Openings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Post new job positions, track applications, and candidates</p>
        </div>
        <Button variant="primary">
          <FiPlus className="mr-2" /> Post New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 p-3 rounded-lg"><FiBriefcase className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Job Postings</p>
            <h3 className="text-2xl font-bold">2</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 p-3 rounded-lg"><FiUsers className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Applicants</p>
            <h3 className="text-2xl font-bold">47</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 p-3 rounded-lg"><FiUsers className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Shortlisted</p>
            <h3 className="text-2xl font-bold">9</h3>
          </div>
        </Card>
      </div>

      <Card title="Current Job Openings">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 font-semibold">Job Title</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Job Type</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Applicants</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-4 font-semibold text-slate-850 dark:text-slate-200">{row.title}</td>
                  <td className="py-4 text-slate-600 dark:text-slate-400">{row.department}</td>
                  <td className="py-4 text-slate-650">{row.type}</td>
                  <td className="py-4 text-slate-500">{row.locations}</td>
                  <td className="py-4 text-slate-900 dark:text-white font-bold">{row.candidates} candidates</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${row.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-350'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Recruitment;
