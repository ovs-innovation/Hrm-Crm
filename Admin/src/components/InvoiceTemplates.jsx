import React from 'react';

const formatCurrency = (n, symbol = '₹') => {
  return `${symbol}${Number(n || 0).toLocaleString('en-IN')}`;
};

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return '';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
  return str;
};

export const THEME_CONFIGS = {
  corporate: { name: 'Corporate Classic', primaryColor: '#0052CC', fontFamily: 'Inter, sans-serif' },
  minimal: { name: 'Minimal Modern', primaryColor: '#111827', fontFamily: 'Inter, sans-serif' },
  executive: { name: 'Executive Premium', primaryColor: '#92400E', fontFamily: 'Georgia, serif' },
  gst: { name: 'GST Business', primaryColor: '#0F766E', fontFamily: 'Inter, sans-serif' },
  creative: { name: 'Creative Agency', primaryColor: '#334155', fontFamily: 'Inter, sans-serif' }
};

const realItems = (items) =>
  (items || []).filter((item) => item && !item.isEmpty && (item.item || item.description));

// 1. Corporate Classic Layout
const CorporateClassic = ({ data }) => {
  const {
    invoiceNumber, invoiceDate, dueDate, companyName, companyGst,
    companyAddress, companyPhone, companyEmail, logoUrl, customerName,
    billingAddress, customerGst, items, subtotal, cgst, sgst, total, advancePaid,
    pendingAmount, termsAndConditions, bankName, accountNumber, ifscCode, currency
  } = data;

  const lineItems = (items || []).filter((item) => item && !item.isEmpty && (item.item || item.description));

  return (
    <div className="bg-white px-10 py-8 text-slate-800 flex flex-col" style={{ minHeight: '297mm', fontFamily: 'Inter, sans-serif', fontSize: '12px', boxSizing: 'border-box' }}>
      <div className="flex items-start justify-between gap-6">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="mb-2 max-h-16 object-contain" />
          ) : (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1E51A4] text-sm font-bold text-white">V</div>
              <div className="flex flex-col">
                <span className="leading-none font-bold tracking-tight text-slate-900">Vastora Tech</span>
                <span className="mt-0.5 text-[8px] leading-none text-slate-400">Your vision our creation</span>
              </div>
            </div>
          )}
          <h2 className="text-sm font-bold uppercase text-slate-950">{companyName}</h2>
          <p className="mt-0.5 max-w-sm text-[11px] leading-snug text-slate-600">{companyAddress}</p>
          {companyPhone && <p className="mt-0.5 text-[11px] text-slate-600">Phone: {companyPhone}</p>}
          {companyEmail && <p className="mt-0.5 text-[11px] text-slate-600">Email: {companyEmail}</p>}
          {companyGst && <p className="mt-1 text-[11px] font-semibold text-slate-800">GSTIN: {companyGst}</p>}
        </div>
        <div className="text-right shrink-0">
          <h1 className="mb-2 text-lg font-bold uppercase tracking-tight text-[#1E51A4]">Proforma Invoice</h1>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div><strong className="text-slate-950">Invoice No:</strong> {invoiceNumber}</div>
            <div><strong className="text-slate-950">Date:</strong> {invoiceDate}</div>
            <div><strong className="text-slate-950">Valid Until:</strong> {dueDate}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded border border-slate-200 bg-slate-50/70 px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Bill To</div>
        <div className="text-xs font-semibold text-slate-900">{customerName}</div>
        {billingAddress && <div className="text-[11px] leading-snug text-slate-600">{billingAddress}</div>}
        {customerGst && <div className="text-[11px] font-semibold text-slate-800">GSTIN: {customerGst}</div>}
      </div>

      <table className="mt-4 w-full border-collapse border border-slate-200 text-left text-xs">
        <thead>
          <tr className="bg-[#1E51A4] text-[11px] font-semibold text-white">
            <th className="w-10 border-r border-blue-400 px-2 py-1.5 text-center">#</th>
            <th className="border-r border-blue-400 px-2 py-1.5">Description</th>
            <th className="w-20 border-r border-blue-400 px-2 py-1.5 text-center">HSN/SAC</th>
            <th className="w-12 border-r border-blue-400 px-2 py-1.5 text-center">Qty</th>
            <th className="w-20 border-r border-blue-400 px-2 py-1.5 text-right">Rate</th>
            <th className="w-14 border-r border-blue-400 px-2 py-1.5 text-center">Tax</th>
            <th className="w-24 px-2 py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-3 text-center text-slate-400">No line items</td>
            </tr>
          )}
          {lineItems.map((item, idx) => {
            const qty = Number(item.qty || 0);
            const price = Number(item.price || 0);
            return (
              <tr key={idx} className="border-b border-slate-200 even:bg-slate-50/80">
                <td className="border-r border-slate-200 px-2 py-1.5 text-center text-slate-500">{idx + 1}</td>
                <td className="border-r border-slate-200 px-2 py-1.5 font-medium text-slate-900">{item.item || item.description}</td>
                <td className="border-r border-slate-200 px-2 py-1.5 text-center text-slate-600">{item.hsn || '—'}</td>
                <td className="border-r border-slate-200 px-2 py-1.5 text-center">{qty}</td>
                <td className="border-r border-slate-200 px-2 py-1.5 text-right tabular-nums">{formatCurrency(price, '')}</td>
                <td className="border-r border-slate-200 px-2 py-1.5 text-center">{item.tax ?? 0}%</td>
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900">{formatCurrency(qty * price, currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {total > 0 && (
        <div className="mt-2 border border-t-0 border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
          <strong className="text-slate-800">Amount in words: </strong>
          {numberToWords(Math.round(Number(total) || 0))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {termsAndConditions && (
            <div>
              <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Terms & Conditions</h4>
              <div className="whitespace-pre-line text-[11px] leading-snug text-slate-600">{termsAndConditions}</div>
            </div>
          )}
          {(bankName || accountNumber) && (
            <div>
              <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Bank Details</h4>
              <div className="space-y-0.5 text-[11px] text-slate-600">
                {bankName && <div><strong>Account Name:</strong> {bankName}</div>}
                {accountNumber && <div><strong>Account No:</strong> {accountNumber}</div>}
                {ifscCode && <div><strong>IFSC:</strong> {ifscCode}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded border border-slate-200 text-xs">
          <div className="flex justify-between border-b border-slate-100 px-3 py-1.5 text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 px-3 py-1.5 text-slate-600">
            <span>CGST (9%)</span>
            <span className="font-semibold tabular-nums">{formatCurrency(cgst, currency)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 px-3 py-1.5 text-slate-600">
            <span>SGST (9%)</span>
            <span className="font-semibold tabular-nums">{formatCurrency(sgst, currency)}</span>
          </div>
          <div className="flex justify-between bg-slate-50 px-3 py-2 text-sm font-bold text-slate-950">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatCurrency(total, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-3 py-1.5 font-semibold text-slate-800">
            <span>Received</span>
            <span className="tabular-nums">{formatCurrency(advancePaid, currency)}</span>
          </div>
          <div className="flex justify-between px-3 py-1.5 font-bold text-rose-600">
            <span>Pending</span>
            <span className="tabular-nums">{formatCurrency(pendingAmount, currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <p className="text-[10px] text-slate-400">This is a computer-generated invoice.</p>
        <div className="w-40 text-center">
          <div className="h-8" />
          <div className="border-t border-slate-400 pt-1 text-[10px] font-semibold text-slate-700">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

// 2. Minimal Modern — clean Scandinavian, no tax-grid look
const MinimalModern = ({ data }) => {
  const {
    invoiceNumber, invoiceDate, dueDate, companyName, companyAddress, companyPhone, companyEmail,
    logoUrl, customerName, billingAddress, items, subtotal, total, advancePaid, pendingAmount,
    bankName, accountNumber, ifscCode, currency, signatureUrl
  } = data;
  const rows = realItems(items);
  const paid = Number(advancePaid || 0);
  const due = Number(pendingAmount || 0);

  return (
    <div className="relative bg-white px-12 py-10 text-[#111827]" style={{ minHeight: '297mm', fontFamily: 'Inter, sans-serif', fontSize: '12px', boxSizing: 'border-box' }}>
      <div className="flex items-start justify-between">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="mb-4 h-10 object-contain grayscale" />
          ) : (
            <p className="mb-4 text-xl font-light tracking-tight">{companyName}</p>
          )}
          <p className="max-w-[220px] text-[11px] leading-relaxed text-neutral-500">{companyAddress}</p>
          {companyEmail && <p className="mt-1 text-[11px] text-neutral-500">{companyEmail}</p>}
          {companyPhone && <p className="text-[11px] text-neutral-500">{companyPhone}</p>}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Invoice</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{invoiceNumber}</p>
          <p className="mt-3 text-[11px] text-neutral-500">Issued {invoiceDate}</p>
          {dueDate && <p className="text-[11px] text-neutral-500">Due {dueDate}</p>}
          {due > 0 && (
            <span className="mt-3 inline-block rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Balance due</span>
          )}
          {due <= 0 && paid > 0 && (
            <span className="mt-3 inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Paid</span>
          )}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-10 border-y border-neutral-200 py-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Billed to</p>
          <p className="mt-1.5 text-sm font-medium">{customerName}</p>
          {billingAddress && <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-neutral-500">{billingAddress}</p>}
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">From</p>
          <p className="mt-1.5 text-sm font-medium">{companyName}</p>
        </div>
      </div>

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            <th className="pb-2 font-medium">Service</th>
            <th className="w-16 pb-2 text-center font-medium">Qty</th>
            <th className="w-24 pb-2 text-right font-medium">Rate</th>
            <th className="w-28 pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => (
            <tr key={idx} className="border-t border-neutral-100">
              <td className="py-3 pr-3 text-[13px] font-medium">{item.item || item.description}</td>
              <td className="py-3 text-center text-neutral-500">{item.qty}</td>
              <td className="py-3 text-right tabular-nums text-neutral-500">{formatCurrency(item.price, currency)}</td>
              <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(Number(item.qty || 0) * Number(item.price || 0), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto w-64 space-y-2 text-[12px]">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-900 pt-2 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total, currency)}</span>
        </div>
        {paid > 0 && (
          <div className="flex justify-between text-neutral-500">
            <span>Received</span>
            <span className="tabular-nums">{formatCurrency(paid, currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>Amount due</span>
          <span className="tabular-nums">{formatCurrency(due, currency)}</span>
        </div>
      </div>

      {(bankName || accountNumber) && (
        <div className="mt-10 max-w-sm text-[11px] leading-relaxed text-neutral-500">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Payment</p>
          {bankName && <p>{bankName}</p>}
          {accountNumber && <p>A/c {accountNumber}</p>}
          {ifscCode && <p>IFSC {ifscCode}</p>}
        </div>
      )}

      <div className="mt-12 flex items-end justify-between">
        <p className="text-[11px] text-neutral-400">Thank you.</p>
        <div className="w-36 text-center">
          {signatureUrl ? <img src={signatureUrl} alt="" className="mx-auto h-8 object-contain" /> : <div className="h-8" />}
          <p className="mt-1 border-t border-neutral-300 pt-1 text-[10px] text-neutral-500">Signature</p>
        </div>
      </div>
    </div>
  );
};

// 3. Executive Premium — letterhead, gold rule, serif
const ExecutivePremium = ({ data }) => {
  const {
    invoiceNumber, invoiceDate, dueDate, companyName, companyAddress, companyGst, companyPhone,
    customerName, billingAddress, customerGst, items, subtotal, cgst, sgst, total, advancePaid,
    pendingAmount, termsAndConditions, bankName, accountNumber, ifscCode, currency, logoUrl
  } = data;
  const rows = realItems(items);

  return (
    <div className="bg-[#FBF8F1] text-[#1C1917]" style={{ minHeight: '297mm', fontFamily: 'Georgia, serif', fontSize: '12px', boxSizing: 'border-box' }}>
      <div className="bg-[#1C1917] px-10 py-6 text-[#FBF8F1]">
        <div className="flex items-end justify-between gap-6">
          <div>
            {logoUrl && <img src={logoUrl} alt="" className="mb-3 h-10 object-contain brightness-0 invert" />}
            <h1 className="text-xl font-normal tracking-wide">{companyName}</h1>
            <p className="mt-1 max-w-sm font-sans text-[11px] text-neutral-400">{companyAddress}</p>
          </div>
          <div className="text-right font-sans">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4A574]">Private invoice</p>
            <p className="mt-1 text-lg">{invoiceNumber}</p>
          </div>
        </div>
      </div>
      <div className="h-[3px] bg-[#D4A574]" />

      <div className="px-10 py-7">
        <div className="grid grid-cols-2 gap-8 font-sans text-[12px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#92400E]">Prepared for</p>
            <p className="mt-1 font-serif text-[15px]">{customerName}</p>
            {billingAddress && <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{billingAddress}</p>}
            {customerGst && <p className="mt-1 text-[11px]">GSTIN {customerGst}</p>}
          </div>
          <div className="text-right text-[11px] text-neutral-600">
            <p>Issued {invoiceDate}</p>
            {dueDate && <p>Payable by {dueDate}</p>}
            {companyGst && <p className="mt-2">Supplier GSTIN {companyGst}</p>}
            {companyPhone && <p>{companyPhone}</p>}
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#D4A574] font-sans text-[10px] uppercase tracking-[0.14em] text-[#92400E]">
              <th className="py-2 font-medium">Description</th>
              <th className="w-14 py-2 text-center font-medium">Qty</th>
              <th className="w-24 py-2 text-right font-medium">Fee</th>
              <th className="w-28 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={idx} className="border-b border-[#E7E0D4]">
                <td className="py-2.5 pr-3">{item.item || item.description}</td>
                <td className="py-2.5 text-center font-sans text-neutral-600">{item.qty}</td>
                <td className="py-2.5 text-right font-sans tabular-nums text-neutral-600">{formatCurrency(item.price, '')}</td>
                <td className="py-2.5 text-right font-sans tabular-nums font-medium">{formatCurrency(Number(item.qty || 0) * Number(item.price || 0), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-8">
          <div className="font-sans text-[11px] leading-relaxed text-neutral-600">
            {termsAndConditions && (
              <>
                <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#92400E]">Terms</p>
                <p className="whitespace-pre-line">{termsAndConditions}</p>
              </>
            )}
            {(bankName || accountNumber) && (
              <div className="mt-4">
                <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#92400E]">Wire details</p>
                {bankName && <p>{bankName}</p>}
                {accountNumber && <p>{accountNumber}</p>}
                {ifscCode && <p>{ifscCode}</p>}
              </div>
            )}
          </div>
          <div className="font-sans text-[12px]">
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            {Number(cgst) > 0 && (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>CGST</span><span className="tabular-nums">{formatCurrency(cgst, currency)}</span>
              </div>
            )}
            {Number(sgst) > 0 && (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>SGST</span><span className="tabular-nums">{formatCurrency(sgst, currency)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-[#1C1917] pt-2 text-[14px] font-serif">
              <span>Total</span><span className="tabular-nums">{formatCurrency(total, currency)}</span>
            </div>
            <div className="mt-2 flex justify-between text-neutral-600">
              <span>Received</span><span className="tabular-nums">{formatCurrency(advancePaid, currency)}</span>
            </div>
            <div className="flex justify-between font-medium text-[#92400E]">
              <span>Balance</span><span className="tabular-nums">{formatCurrency(pendingAmount, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. GST Business — Indian tax invoice grid (Tally / GST portal style)
const GSTBusiness = ({ data }) => {
  const {
    invoiceNumber, invoiceDate, dueDate, companyName, companyGst, companyAddress, companyPhone,
    customerName, customerGst, billingAddress, items, subtotal, cgst, sgst, total,
    termsAndConditions, bankName, accountNumber, ifscCode, currency, advancePaid, pendingAmount
  } = data;
  const rows = realItems(items);

  return (
    <div className="bg-white p-6 text-slate-900" style={{ minHeight: '297mm', fontFamily: 'Inter, sans-serif', fontSize: '11px', boxSizing: 'border-box' }}>
      <div className="border-[1.5px] border-teal-800">
        <div className="bg-teal-800 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-white">
          Tax Invoice
        </div>
        <div className="grid grid-cols-2 divide-x divide-teal-800 border-b border-teal-800">
          <div className="p-3">
            <p className="text-[9px] font-bold uppercase text-teal-800">Supplier (From)</p>
            <p className="mt-0.5 font-bold">{companyName}</p>
            <p className="mt-0.5 leading-snug text-slate-600">{companyAddress}</p>
            {companyPhone && <p>Ph: {companyPhone}</p>}
            <p className="mt-1 font-semibold">GSTIN: {companyGst || '—'}</p>
          </div>
          <div className="p-3 space-y-0.5">
            <p><span className="text-slate-500">Invoice No.</span> <strong>{invoiceNumber}</strong></p>
            <p><span className="text-slate-500">Invoice Date</span> <strong>{invoiceDate}</strong></p>
            {dueDate && <p><span className="text-slate-500">Due Date</span> <strong>{dueDate}</strong></p>}
            <p><span className="text-slate-500">Place of Supply</span> <strong>India</strong></p>
          </div>
        </div>
        <div className="border-b border-teal-800 p-3">
          <p className="text-[9px] font-bold uppercase text-teal-800">Recipient (Bill To)</p>
          <p className="mt-0.5 font-bold">{customerName}</p>
          {billingAddress && <p className="leading-snug text-slate-600">{billingAddress}</p>}
          <p className="mt-0.5 font-semibold">GSTIN: {customerGst || 'URP / Unregistered'}</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-teal-50 text-[10px] font-bold uppercase text-teal-900">
              <th className="w-8 border-b border-r border-teal-800 px-1.5 py-1.5 text-center">Sl</th>
              <th className="border-b border-r border-teal-800 px-1.5 py-1.5 text-left">Description of Goods / Services</th>
              <th className="w-[72px] border-b border-r border-teal-800 px-1.5 py-1.5 text-center">HSN/SAC</th>
              <th className="w-12 border-b border-r border-teal-800 px-1.5 py-1.5 text-right">Qty</th>
              <th className="w-[72px] border-b border-r border-teal-800 px-1.5 py-1.5 text-right">Rate</th>
              <th className="w-12 border-b border-r border-teal-800 px-1.5 py-1.5 text-center">Tax</th>
              <th className="w-[88px] border-b border-teal-800 px-1.5 py-1.5 text-right">Taxable value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={idx}>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 text-center">{idx + 1}</td>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 font-medium">{item.item || item.description}</td>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 text-center">{item.hsn || '—'}</td>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 text-right">{item.qty}</td>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 text-right tabular-nums">{formatCurrency(item.price, '')}</td>
                <td className="border-b border-r border-teal-200 px-1.5 py-1.5 text-center">{item.tax ?? 18}%</td>
                <td className="border-b border-teal-200 px-1.5 py-1.5 text-right tabular-nums font-semibold">{formatCurrency(Number(item.qty || 0) * Number(item.price || 0), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 divide-x divide-teal-800 border-t border-teal-800">
          <div className="p-3">
            {total > 0 && (
              <p className="text-[11px] leading-snug">
                <span className="font-bold">Amount in words: </span>
                {numberToWords(Math.round(Number(total) || 0))}
              </p>
            )}
            {termsAndConditions && (
              <p className="mt-3 whitespace-pre-line text-[10px] text-slate-600">
                <span className="font-bold text-teal-800">Declaration. </span>{termsAndConditions}
              </p>
            )}
            {(bankName || accountNumber) && (
              <p className="mt-3 text-[10px] text-slate-600">
                <span className="font-bold text-teal-800">Bank. </span>
                {[bankName, accountNumber, ifscCode].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="p-0 text-[11px]">
            <div className="flex justify-between border-b border-teal-200 px-3 py-1.5">
              <span>Taxable value</span><span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between border-b border-teal-200 px-3 py-1.5">
              <span>CGST @ 9%</span><span className="tabular-nums">{formatCurrency(cgst, currency)}</span>
            </div>
            <div className="flex justify-between border-b border-teal-200 px-3 py-1.5">
              <span>SGST @ 9%</span><span className="tabular-nums">{formatCurrency(sgst, currency)}</span>
            </div>
            <div className="flex justify-between bg-teal-800 px-3 py-2 font-bold text-white">
              <span>Invoice total</span><span className="tabular-nums">{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between border-b border-teal-200 px-3 py-1.5">
              <span>Received</span><span className="tabular-nums">{formatCurrency(advancePaid, currency)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5 font-bold text-teal-900">
              <span>Balance payable</span><span className="tabular-nums">{formatCurrency(pendingAmount, currency)}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-t border-teal-800 px-3 py-2 text-[9px] text-slate-500">
          <span>E. & O.E. · Computer generated GST invoice</span>
          <span>Authorised signatory</span>
        </div>
      </div>
    </div>
  );
};

// 5. Creative Agency — simple studio invoice, no gimmicks
const CreativeAgency = ({ data }) => {
  const {
    invoiceNumber, invoiceDate, dueDate, companyName, companyAddress, companyPhone, companyEmail,
    companyGst, customerName, billingAddress, customerGst, items, subtotal, cgst, sgst, total,
    termsAndConditions, currency, advancePaid, pendingAmount, logoUrl, bankName, accountNumber, ifscCode
  } = data;
  const rows = realItems(items);

  return (
    <div className="bg-white px-11 py-10 text-slate-800" style={{ minHeight: '297mm', fontFamily: 'Inter, sans-serif', fontSize: '12px', boxSizing: 'border-box' }}>
      <div className="flex items-start justify-between border-b border-slate-200 pb-5">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="mb-3 max-h-12 object-contain" />
          ) : null}
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{companyName}</h1>
          <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">{companyAddress}</p>
          {companyPhone && <p className="mt-0.5 text-[11px] text-slate-500">{companyPhone}</p>}
          {companyEmail && <p className="text-[11px] text-slate-500">{companyEmail}</p>}
          {companyGst && <p className="mt-1 text-[11px] text-slate-600">GSTIN: {companyGst}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Invoice</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{invoiceNumber}</p>
          <p className="mt-3 text-[11px] text-slate-500">Date: {invoiceDate}</p>
          {dueDate && <p className="text-[11px] text-slate-500">Due: {dueDate}</p>}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bill to</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{customerName}</p>
        {billingAddress && <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-slate-500">{billingAddress}</p>}
        {customerGst && <p className="mt-0.5 text-[11px] text-slate-600">GSTIN: {customerGst}</p>}
      </div>

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="border-b border-slate-300 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="w-8 py-2 font-semibold">No</th>
            <th className="py-2 font-semibold">Description</th>
            <th className="w-14 py-2 text-center font-semibold">Qty</th>
            <th className="w-24 py-2 text-right font-semibold">Rate</th>
            <th className="w-28 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-2.5 text-slate-400">{idx + 1}</td>
              <td className="py-2.5 pr-3">
                <p className="font-medium text-slate-900">{item.item || item.description}</p>
                {item.hsn && <p className="text-[10px] text-slate-400">HSN {item.hsn}</p>}
              </td>
              <td className="py-2.5 text-center text-slate-600">{item.qty}</td>
              <td className="py-2.5 text-right tabular-nums text-slate-600">{formatCurrency(item.price, currency)}</td>
              <td className="py-2.5 text-right tabular-nums font-medium text-slate-900">
                {formatCurrency(Number(item.qty || 0) * Number(item.price || 0), currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 grid grid-cols-2 gap-8">
        <div className="text-[11px] leading-relaxed text-slate-500">
          {total > 0 && (
            <p className="mb-3">
              <span className="font-semibold text-slate-700">Amount in words: </span>
              {numberToWords(Math.round(Number(total) || 0))}
            </p>
          )}
          {termsAndConditions && (
            <div className="whitespace-pre-line">{termsAndConditions}</div>
          )}
          {(bankName || accountNumber) && (
            <div className="mt-4">
              <p className="font-semibold text-slate-700">Bank details</p>
              {bankName && <p>{bankName}</p>}
              {accountNumber && <p>A/c {accountNumber}</p>}
              {ifscCode && <p>IFSC {ifscCode}</p>}
            </div>
          )}
        </div>
        <div className="text-[12px]">
          <div className="flex justify-between py-1 text-slate-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
          </div>
          {Number(cgst) > 0 && (
            <div className="flex justify-between py-1 text-slate-500">
              <span>CGST</span>
              <span className="tabular-nums">{formatCurrency(cgst, currency)}</span>
            </div>
          )}
          {Number(sgst) > 0 && (
            <div className="flex justify-between py-1 text-slate-500">
              <span>SGST</span>
              <span className="tabular-nums">{formatCurrency(sgst, currency)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-slate-300 pt-2 font-semibold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total, currency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-500">
            <span>Received</span>
            <span className="tabular-nums">{formatCurrency(advancePaid, currency)}</span>
          </div>
          <div className="flex justify-between py-1 font-semibold text-slate-900">
            <span>Balance due</span>
            <span className="tabular-nums">{formatCurrency(pendingAmount, currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <p className="text-[10px] text-slate-400">This is a computer-generated invoice.</p>
        <div className="w-40 text-center">
          <div className="h-8" />
          <p className="border-t border-slate-300 pt-1 text-[10px] text-slate-600">Authorised signatory</p>
        </div>
      </div>
    </div>
  );
};

export const LiveInvoicePreview = ({ data, activeTemplate = 'corporate', zoom = 1, orientation = 'portrait' }) => {
  const sheetWidth = orientation === 'portrait' ? '210mm' : '297mm';
  const sheetMinHeight = orientation === 'portrait' ? '297mm' : '210mm';

  return (
    <div
      className="overflow-hidden bg-white shadow-xl border border-slate-200 select-none print:shadow-none print:border-none print:p-0 print:m-0"
      style={{
        width: `calc(${sheetWidth} * ${zoom})`,
        height: `calc(${sheetMinHeight} * ${zoom})`,
        position: 'relative'
      }}
    >
      <div
        id="a4-invoice-sheet"
        style={{
          width: sheetWidth,
          minHeight: sheetMinHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          boxSizing: 'border-box'
        }}
      >
        {activeTemplate === 'corporate' && <CorporateClassic data={data} />}
        {activeTemplate === 'minimal' && <MinimalModern data={data} />}
        {activeTemplate === 'executive' && <ExecutivePremium data={data} />}
        {activeTemplate === 'gst' && <GSTBusiness data={data} />}
        {activeTemplate === 'creative' && <CreativeAgency data={data} />}
      </div>
    </div>
  );
};
