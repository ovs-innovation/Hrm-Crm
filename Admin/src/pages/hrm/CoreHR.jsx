import React, { useState } from 'react';
import { Card, Button } from '../../components';
import { FiAward, FiTrendingUp, FiAlertTriangle, FiUserCheck } from 'react-icons/fi';

const CoreHR = () => {
  const [activeTab, setActiveTab] = useState('awards');

  const awards = [
    { id: 1, employee: 'John Doe', awardType: 'Employee of the Month', date: 'Oct 01, 2026', gift: 'Gift Voucher', description: 'Exceptional performance in project delivery' },
    { id: 2, employee: 'Jane Smith', awardType: 'Innovator Award', date: 'Sep 15, 2026', gift: 'Cash Prize', description: 'Developed new automated onboarding workflow' },
  ];

  const promotions = [
    { id: 1, employee: 'Robert Wilson', designation: 'Developer', promotedTo: 'Senior Developer', date: 'Jul 01, 2026' },
    { id: 2, employee: 'Emily Davis', designation: 'Marketing Executive', promotedTo: 'Marketing Manager', date: 'Aug 15, 2026' },
  ];

  const warnings = [
    { id: 1, employee: 'Michael Johnson', warningBy: 'HR Dept', date: 'Oct 05, 2026', subject: 'Late Attendance', description: 'Frequent late entries recorded for 3 consecutive weeks.' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Core HR Management</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage awards, promotions, and disciplinary actions</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'awards', label: 'Awards', icon: FiAward },
          { id: 'promotions', label: 'Promotions', icon: FiTrendingUp },
          { id: 'warnings', label: 'Warnings & Complaints', icon: FiAlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all -mb-px
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'awards' && (
        <Card title="Awards List">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Award Type</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Gift/Reward</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {awards.map((award) => (
                  <tr key={award.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{award.employee}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{award.awardType}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{award.date}</td>
                    <td className="py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{award.gift}</span></td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{award.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'promotions' && (
        <Card title="Promotions History">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Previous Designation</th>
                  <th className="pb-3 font-semibold">New Designation</th>
                  <th className="pb-3 font-semibold">Promotion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{promo.employee}</td>
                    <td className="py-4 text-slate-500">{promo.designation}</td>
                    <td className="py-4 text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                      {promo.promotedTo}
                      <span className="text-xs font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{promo.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'warnings' && (
        <Card title="Warnings Issued">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Warning By</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {warnings.map((warning) => (
                  <tr key={warning.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{warning.employee}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{warning.warningBy}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{warning.date}</td>
                    <td className="py-4 text-amber-600 dark:text-amber-400 font-semibold">{warning.subject}</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{warning.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CoreHR;
