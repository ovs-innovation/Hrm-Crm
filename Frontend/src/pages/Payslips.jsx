import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PageShell from '../components/PageShell';
import VastoraLogo from '../components/VastoraLogo';
import api from '../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Payslips = () => {
  const user = useSelector((state) => state.auth.user || {});
  const employeeId = user.employeeId;
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    api.get(`/payslips?employeeId=${employeeId}`)
      .then((res) => setPayslips(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  return (
    <PageShell title="Payslips" description="View your salary slips" count={payslips.length}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Month</th>
                <th className="px-4 py-2.5 font-medium text-right">Net pay</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : payslips.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-muted">No payslips available yet.</td></tr>
              ) : payslips.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer border-b border-line last:border-0 hover:bg-soft/60 ${selected?._id === p._id ? 'bg-brand/5' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{p.month}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.netPay)}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${p.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded border border-line bg-surface p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                <VastoraLogo />
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Salary slip</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink">{selected.month}</p>
                </div>
              </div>
              <table className="mt-4 w-full text-[13px]">
                <tbody>
                  <tr className="border-b border-line"><td className="py-2.5 text-muted">Basic</td><td className="py-2.5 text-right tabular-nums">{formatINR(selected.basicSalary)}</td></tr>
                  <tr className="border-b border-line"><td className="py-2.5 text-muted">Allowances</td><td className="py-2.5 text-right tabular-nums text-green-700">+ {formatINR(selected.allowances)}</td></tr>
                  <tr className="border-b border-line"><td className="py-2.5 text-muted">Deductions</td><td className="py-2.5 text-right tabular-nums text-red-600">− {formatINR(selected.deductions)}</td></tr>
                  <tr><td className="py-3 font-semibold text-ink">Net pay</td><td className="py-3 text-right text-lg font-semibold tabular-nums text-brand">{formatINR(selected.netPay)}</td></tr>
                </tbody>
              </table>
              <p className="mt-4 text-center text-[11px] text-muted">Vastora Tech · Confidential</p>
            </>
          ) : (
            <p className="py-12 text-center text-[13px] text-muted">Select a payslip to view details.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Payslips;
