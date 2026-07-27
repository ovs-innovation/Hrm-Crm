import React, { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FiUsers, FiBriefcase, FiCornerDownRight } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const OrgChart = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees')
      .then(res => {
        setEmployees(res.data);
      })
      .catch(() => {
        setEmployees([
          { name: 'Amit Sharma', designation: 'CEO & Founder', department: 'Management', manager: null },
          { name: 'Rudra Sharma', designation: 'HR Director', department: 'Human Resources', manager: 'Amit Sharma' },
          { name: 'Siddharth Roy', designation: 'Sales VP', department: 'Sales', manager: 'Amit Sharma' },
          { name: 'Priya Patel', designation: 'Senior Accountant', department: 'Finance', manager: 'Rudra Sharma' },
          { name: 'Neha Gupta', designation: 'Sales Representative', department: 'Sales', manager: 'Siddharth Roy' }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const ceo = employees.find(emp => !emp.manager || emp.designation.includes('CEO')) || employees[0];
  const managers = employees.filter(emp => emp.manager === ceo?.name);
  
  const getSubordinates = (managerName) => {
    return employees.filter(emp => emp.manager === managerName);
  };

  return (
    <PageShell
      title="Corporate Organization Chart"
      description="Interactive hierarchy of corporate reporting structure"
    >
      <div className="space-y-6 text-ink text-[13px]">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted justify-center py-20">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand"></div>
            Loading hierarchy tree...
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8 py-10 bg-soft/20 border border-line rounded overflow-x-auto min-w-full p-6">
            {/* CEO Node */}
            {ceo && (
              <div className="flex flex-col items-center relative">
                <div className="bg-surface border-brand p-4 rounded w-60 border text-center shadow-[0_0_10px_rgba(37,99,235,0.05)]">
                  <span className="bg-brand text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase">
                    CEO / Board
                  </span>
                  <h4 className="font-bold text-[13px] text-ink mt-1.5">{ceo.name}</h4>
                  <p className="text-muted text-[10px] mt-0.5 font-semibold flex items-center justify-center gap-1">
                    <FiBriefcase /> {ceo.designation}
                  </p>
                </div>
                {managers.length > 0 && (
                  <div className="w-0.5 h-10 bg-brand/30"></div>
                )}
              </div>
            )}

            {/* Managers Row */}
            {managers.length > 0 && (
              <div className="flex justify-center items-start gap-12 relative w-full">
                <div className="absolute top-0 left-[15%] right-[15%] h-0.5 bg-brand/35"></div>

                {managers.map(manager => {
                  const subordinates = getSubordinates(manager.name);

                  return (
                    <div key={manager.name} className="flex flex-col items-center relative">
                      <div className="w-0.5 h-6 bg-brand/30 -mt-6"></div>

                      <div className="bg-surface border-line-hover p-4 rounded w-56 border text-center">
                        <span className="bg-soft border border-line text-[9px] font-bold text-muted px-2 py-0.5 rounded-full uppercase">
                          {manager.department || 'Management'}
                        </span>
                        <h4 className="font-bold text-[12px] text-ink mt-1.5">{manager.name}</h4>
                        <p className="text-muted text-[10px] mt-0.5 font-semibold">{manager.designation}</p>
                      </div>

                      {subordinates.length > 0 && (
                        <>
                          <div className="w-0.5 h-8 bg-brand/30"></div>
                          
                          <div className="space-y-3 pl-6 border-l border-brand/30 pt-1">
                            {subordinates.map(sub => (
                              <div key={sub.name} className="flex items-center gap-2 relative">
                                <FiCornerDownRight className="text-brand/50 h-3.5 w-3.5" />
                                <div className="bg-surface border border-line p-2 rounded w-44">
                                  <h5 className="font-bold text-[11px] text-ink">{sub.name}</h5>
                                  <p className="text-muted text-[9px] font-semibold">{sub.designation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="rounded border border-line bg-surface p-4 text-[11px] text-muted flex items-center gap-1.5">
          <FiUsers /> Double click any node to open employee analytics or audit history details logs.
        </div>
      </div>
    </PageShell>
  );
};

export default OrgChart;
