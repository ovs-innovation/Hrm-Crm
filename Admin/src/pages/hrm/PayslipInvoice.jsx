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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 font-sans no-print text-slate-800">
      
      {/* Top Actions (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate('/hrm/payroll')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <FiArrowLeft /> Back to Payroll
        </button>
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm"
          >
            <FiDownload /> PDF
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-500/30 transition-all"
          >
            <FiPrinter /> Print Invoice
          </button>
        </div>
      </div>

      {/* The Printable A4 Page Area */}
      <div className="max-w-4xl mx-auto bg-white rounded-none shadow-2xl p-10 md:p-16 print:p-8 print:shadow-none print:max-w-none w-full min-h-[1056px]">
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 flex items-center justify-center">
                <span className="text-white text-sm font-black tracking-tighter">HR</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">HRM Pro Inc.</h1>
            </div>
            <p className="text-sm text-slate-500">123 Business Avenue, Tech District</p>
            <p className="text-sm text-slate-500">San Francisco, CA 94107</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-200 tracking-widest uppercase mb-2">Payslip</h2>
            <p className="text-sm font-bold text-slate-800">Period: <span className="font-normal">{invoiceData.payPeriod}</span></p>
            <p className="text-sm font-bold text-slate-800">Issued On: <span className="font-normal">{invoiceData.dateIssued}</span></p>
          </div>
        </div>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-10 bg-slate-50 p-6 border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Name</p>
            <p className="font-bold text-slate-900">{invoiceData.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
            <p className="font-bold text-slate-900">{invoiceData.employeeId}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
            <p className="font-medium text-slate-800">{invoiceData.department}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
            <p className="font-medium text-slate-800">{invoiceData.designation}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Name</p>
            <p className="font-medium text-slate-800">{invoiceData.bankName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Account</p>
            <p className="font-medium text-slate-800">{invoiceData.accountNo}</p>
          </div>
        </div>

        {/* Financials Table */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-slate-200 pb-8">
          
          {/* Earnings Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Earnings</h3>
            <div className="space-y-3">
              {invoiceData.earnings.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-black mt-6 pt-3 border-t border-slate-200">
              <span>Total Earnings</span>
              <span>{formatCurrency(totalEarnings)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Deductions</h3>
            <div className="space-y-3">
              {invoiceData.deductions.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-black mt-6 pt-3 border-t border-slate-200">
              <span>Total Deductions</span>
              <span>{formatCurrency(totalDeductions)}</span>
            </div>
          </div>

        </div>

        {/* Net Pay Box */}
        <div className="flex justify-end mb-16">
          <div className="w-72 bg-slate-900 text-white p-6 text-center border-4 border-slate-900">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Payable Amount</p>
            <h2 className="text-3xl font-black">{formatCurrency(netPay)}</h2>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="flex justify-between items-end mt-16 pt-8">
          <div>
            <p className="text-xs text-slate-400 font-medium italic">
              This is a computer generated document and does not require a physical signature.
            </p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
            <p className="text-sm font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-xs text-slate-500">Director of Finance</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PayslipInvoice;
