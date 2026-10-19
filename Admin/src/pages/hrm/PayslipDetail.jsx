import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import VastoraLogo from '../../components/VastoraLogo';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PayslipDetail = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payslips/${id}`)
      .then((res) => setPayslip(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <PageShell title="Payslip"><p className="text-[13px] text-muted">Loading…</p></PageShell>;
  }

  if (!payslip) {
    return (
      <PageShell title="Payslip not found">
        <Link to="/hrm/payroll" className="btn-outline inline-flex items-center gap-1 px-3 py-2 text-[13px]"><FiArrowLeft /> Back to payroll</Link>
      </PageShell>
    );
  }

  const breakdown = payslip.breakdown || {};

  return (
    <PageShell
      title="Payslip"
      description={`${payslip.employeeName} · ${payslip.month}`}
      actions={
        <Link to="/hrm/payroll" className="btn-outline inline-flex h-8 items-center gap-1 px-3 text-[13px]"><FiArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
      }
    >
      <article className="mx-auto max-w-2xl overflow-hidden rounded border border-line bg-surface">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <VastoraLogo variant="header" />
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Salary slip</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{payslip.month}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-5 text-[13px] sm:grid-cols-4">
          <div><span className="text-muted">Employee</span><p className="mt-0.5 font-medium text-ink">{payslip.employeeName}</p></div>
          <div><span className="text-muted">Employee ID</span><p className="mt-0.5 font-medium text-ink">{payslip.employeeId}</p></div>
          <div><span className="text-muted">Status</span><p className="mt-0.5 font-medium text-ink">{payslip.status}</p></div>
          <div><span className="text-muted">Paid on</span><p className="mt-0.5 font-medium text-ink">{payslip.paidDate ? new Date(payslip.paidDate).toLocaleDateString('en-IN') : '—'}</p></div>
        </div>

        <table className="w-full border-t border-line text-[13px]">
          <thead>
            <tr className="bg-soft text-left text-muted">
              <th className="px-6 py-2.5 font-medium">Description</th>
              <th className="px-6 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line"><td className="px-6 py-3 text-ink">Basic salary</td><td className="px-6 py-3 text-right tabular-nums">{formatINR(payslip.basicSalary)}</td></tr>
            <tr className="border-t border-line"><td className="px-6 py-3 text-ink">Allowances</td><td className="px-6 py-3 text-right tabular-nums text-green-700">+ {formatINR(payslip.allowances)}</td></tr>
            {breakdown.hra > 0 && <tr className="border-t border-line"><td className="px-6 py-3 pl-10 text-muted">HRA</td><td className="px-6 py-3 text-right tabular-nums">{formatINR(breakdown.hra)}</td></tr>}
            <tr className="border-t border-line"><td className="px-6 py-3 text-ink">Deductions</td><td className="px-6 py-3 text-right tabular-nums text-red-600">− {formatINR(payslip.deductions)}</td></tr>
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-line bg-soft px-6 py-4">
          <p className="text-[13px] font-semibold text-ink">Net pay</p>
          <p className="text-xl font-semibold tabular-nums text-brand">{formatINR(payslip.netPay)}</p>
        </div>
        <p className="px-6 py-3 text-center text-[11px] text-muted">Vastora Tech · Confidential · Generated from payroll</p>
      </article>
    </PageShell>
  );
};

export default PayslipDetail;
