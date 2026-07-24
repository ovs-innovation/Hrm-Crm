import React, { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Profile = () => {
  const user = useSelector((state) => state.auth.user || {});
  const [employee, setEmployee] = useState(user);

  useEffect(() => {
    api.get('/employees').then((res) => {
      const match = res.data.find((e) => e._id === user._id || e.employeeId === user.employeeId);
      if (match) setEmployee(match);
    }).catch(console.error);
  }, [user._id, user.employeeId]);

  const fields = [
    ['Name', employee.name],
    ['Email', employee.email],
    ['Employee ID', employee.employeeId],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Branch', employee.branch],
    ['Role', employee.role],
  ];

  return (
    <PageShell title="Profile" description="Your account details">
      <div className="max-w-lg rounded border border-line bg-surface">
        <dl className="divide-y divide-line">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-3 text-[13px]">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium text-ink">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
};

export default Profile;
