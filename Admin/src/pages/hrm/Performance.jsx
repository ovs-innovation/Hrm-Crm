import React, { useState } from 'react';
import { Card, Button } from '../../components';
import { FiAward, FiTarget, FiActivity } from 'react-icons/fi';

const Performance = () => {
  const indicators = [
    { id: 1, department: 'Engineering', indicator: 'Quality of Work', rating: '★★★★★ (5/5)' },
    { id: 2, department: 'Engineering', indicator: 'Code Speed', rating: '★★★★☆ (4/5)' },
    { id: 3, department: 'HR', indicator: 'Interpersonal Skills', rating: '★★★★★ (5/5)' },
  ];

  const goals = [
    { id: 1, title: 'Release Q3 Onboarding Feature', employee: 'John Doe', status: 'In Progress', progress: '75%' },
    { id: 2, title: 'Optimize API Response Time By 20%', employee: 'Robert Wilson', status: 'Completed', progress: '100%' },
    { id: 3, title: 'Hire 3 Frontend Developers', employee: 'Jane Smith', status: 'In Progress', progress: '33%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Metrics</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor indicators, employee appraisals, and OKR progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Performance Indicators (By Dept)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Metric Name</th>
                  <th className="pb-3 font-semibold">Rating Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {indicators.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-semibold text-slate-850 dark:text-slate-200">{row.department}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{row.indicator}</td>
                    <td className="py-4 text-amber-500 font-medium">{row.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Goal Tracking">
          <div className="space-y-5">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">{goal.title}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Assigned to: {goal.employee}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 font-bold rounded-full
                    ${goal.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {goal.status}
                  </span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${goal.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: goal.progress }}
                  ></div>
                </div>
                <div className="text-right text-xs font-semibold text-slate-500 font-mono">{goal.progress} Complete</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Performance;
