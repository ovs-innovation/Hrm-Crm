import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPrinter, FiArrowLeft, FiDownload } from 'react-icons/fi';

const PayslipInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for the invoice
  const invoiceData = {
    employeeId: id || 'EMP-001',
    name: 'John Doe',
    department: 'Engineering',
    designation: 'Senior Developer',
    bankName: 'Global Bank Inc.',
    accountNo: '**** **** **** 1234',
    payPeriod: 'June 2026',
    dateIssued: 'June 30, 2026',
    earnings: [
      { name: 'Basic Salary', amount: 5000 },
      { name: 'House Rent Allowance (HRA)', amount: 1000 },
      { name: 'Conveyance Allowance', amount: 300 },
      { name: 'Medical Allowance', amount: 200 }
    ],
    deductions: [
      { name: 'Income Tax (TDS)', amount: 200 },
      { name: 'Provident Fund (PF)', amount: 150 },
      { name: 'Professional Tax', amount: 50 }
    ]
  };

  const totalEarnings = invoiceData.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = invoiceData.deductions.reduce((sum, item) => sum + item.amount, 0);
  const netPay = totalEarnings - totalDeductions;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-surface py-8 px-4 font-sans no-print text-navy">
      
      {/* Top Actions (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate('/hrm/payroll')}
          className="flex items-center gap-2 text-muted hover:text-navy transition-colors"
        >
          <FiArrowLeft /> Back to Payroll
        </button>
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-lg text-sm font-bold shadow-sm"
          >
            <FiDownload /> PDF
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-bold shadow-md shadow-brand/15 transition-all"
          >
            <FiPrinter /> Print Invoice
          </button>
        </div>
      </div>

      {/* The Printable A4 Page Area */}
      <div className="max-w-4xl mx-auto bg-white rounded-none shadow-2xl p-10 md:p-16 print:p-8 print:shadow-none print:max-w-none w-full min-h-[1056px]">
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-line pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-navy flex items-center justify-center">
                <span className="text-white text-sm font-black tracking-tighter">HR</span>
              </div>
              <h1 className="text-2xl font-black text-navy tracking-tight">HRM Pro Inc.</h1>
            </div>
            <p className="text-sm text-muted">123 Business Avenue, Tech District</p>
            <p className="text-sm text-muted">San Francisco, CA 94107</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-ink tracking-widest uppercase mb-2">Payslip</h2>
            <p className="text-sm font-bold text-navy">Period: <span className="font-normal">{invoiceData.payPeriod}</span></p>
            <p className="text-sm font-bold text-navy">Issued On: <span className="font-normal">{invoiceData.dateIssued}</span></p>
          </div>
        </div>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-10 bg-white p-6 border border-navy/12">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Employee Name</p>
            <p className="font-bold text-navy">{invoiceData.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Employee ID</p>
            <p className="font-bold text-navy">{invoiceData.employeeId}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Department</p>
            <p className="font-medium text-navy">{invoiceData.department}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Designation</p>
            <p className="font-medium text-navy">{invoiceData.designation}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Bank Name</p>
            <p className="font-medium text-navy">{invoiceData.bankName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Bank Account</p>
            <p className="font-medium text-navy">{invoiceData.accountNo}</p>
          </div>
        </div>

        {/* Financials Table */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-navy/12 pb-8">
          
          {/* Earnings Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-navy border-b-2 border-line pb-2 mb-4">Earnings</h3>
            <div className="space-y-3">
              {invoiceData.earnings.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted">{item.name}</span>
                  <span className="font-semibold text-navy">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-black mt-6 pt-3 border-t border-navy/12">
              <span>Total Earnings</span>
              <span>{formatCurrency(totalEarnings)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-navy border-b-2 border-line pb-2 mb-4">Deductions</h3>
            <div className="space-y-3">
              {invoiceData.deductions.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted">{item.name}</span>
                  <span className="font-semibold text-navy">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-black mt-6 pt-3 border-t border-navy/12">
              <span>Total Deductions</span>
              <span>{formatCurrency(totalDeductions)}</span>
            </div>
          </div>

        </div>

        {/* Net Pay Box */}
        <div className="flex justify-end mb-16">
          <div className="w-72 bg-navy text-white p-6 text-center border-4 border-line">
            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Net Payable Amount</p>
            <h2 className="text-3xl font-black">{formatCurrency(netPay)}</h2>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="flex justify-between items-end mt-16 pt-8">
          <div>
            <p className="text-xs text-muted font-medium italic">
              This is a computer generated document and does not require a physical signature.
            </p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-line mb-2"></div>
            <p className="text-sm font-bold text-navy">Authorized Signatory</p>
            <p className="text-xs text-muted">Director of Finance</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PayslipInvoice;
