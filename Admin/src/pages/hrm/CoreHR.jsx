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
        <h2 className="text-[15px] font-semibold text-ink">Core HR Management</h2>
        <p className="text-muted text-muted text-sm">Manage awards, promotions, and disciplinary actions</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line">
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
                  ? 'border-brand text-brand border-brand text-brand' 
                  : 'border-transparent text-muted hover:text-ink'}`}
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
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Award Type</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Gift/Reward</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {awards.map((award) => (
                  <tr key={award.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{award.employee}</td>
                    <td className="py-4 text-muted text-muted">{award.awardType}</td>
                    <td className="py-4 text-muted text-muted">{award.date}</td>
                    <td className="py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">{award.gift}</span></td>
                    <td className="py-4 text-muted text-muted max-w-xs truncate">{award.description}</td>
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
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Previous Designation</th>
                  <th className="pb-3 font-semibold">New Designation</th>
                  <th className="pb-3 font-semibold">Promotion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{promo.employee}</td>
                    <td className="py-4 text-muted">{promo.designation}</td>
                    <td className="py-4 text-white font-semibold flex items-center gap-2">
                      {promo.promotedTo}
                      <span className="text-xs font-normal text-brand bg-brand/10 px-2 py-0.5 rounded-full">Active</span>
                    </td>
                    <td className="py-4 text-muted text-muted">{promo.date}</td>
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
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Warning By</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {warnings.map((warning) => (
                  <tr key={warning.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{warning.employee}</td>
                    <td className="py-4 text-muted text-muted">{warning.warningBy}</td>
                    <td className="py-4 text-muted text-muted">{warning.date}</td>
                    <td className="py-4 text-brand font-semibold">{warning.subject}</td>
                    <td className="py-4 text-muted text-muted max-w-xs truncate">{warning.description}</td>
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
