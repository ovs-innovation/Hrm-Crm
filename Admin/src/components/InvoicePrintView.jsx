import React from 'react';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const InvoicePrintView = ({ invoice, company }) => {
  if (!invoice) return null;

  return (
    <div id="invoice-print-root" className="bg-white p-8 text-ink print:p-0">
      <div className="mb-6 flex items-start justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold text-brand">{company?.companyName || 'Vastora Tech'}</h1>
          {company?.address && <p className="mt-1 text-sm text-muted">{company.address}</p>}
          {company?.email && <p className="text-sm text-muted">{company.email}</p>}
          {company?.taxId && <p className="text-sm text-muted">GSTIN: {company.taxId}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{invoice.type}</p>
          <p className="text-sm font-semibold">{invoice.number}</p>
          <p className="mt-2 text-sm text-muted">Status: {invoice.status}</p>
          {invoice.dueDate && (
            <p className="text-sm text-muted">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-muted">Bill to</p>
          <p className="font-medium">{invoice.clientName || '—'}</p>
        </div>
        {invoice.dealTitle && (
          <div className="text-right">
            <p className="font-semibold text-muted">Deal</p>
            <p>{invoice.dealTitle}</p>
          </div>
        )}
      </div>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink/20 bg-soft/50">
            <th className="px-2 py-2 text-left font-semibold">Description</th>
            <th className="px-2 py-2 text-right font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Rate</th>
            <th className="px-2 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, i) => (
            <tr key={i} className="border-b border-line">
              <td className="px-2 py-2">{item.description}</td>
              <td className="px-2 py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatINR(item.rate)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatINR(item.amount ?? item.quantity * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(invoice.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Tax ({invoice.taxRate}%)</span><span>{formatINR(invoice.taxAmount)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{formatINR(invoice.total)}</span></div>
      </div>

      {invoice.notes && (
        <div className="mt-8 rounded border border-line bg-soft/30 p-3 text-sm">
          <p className="font-semibold text-muted">Notes</p>
          <p className="mt-1">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};

export const printInvoice = (invoice, company) => {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;

  const rows = (invoice.items || []).map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #E2E8F0">${item.description}</td>
      <td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:right">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:right">${formatINR(item.rate)}</td>
      <td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:right">${formatINR(item.amount ?? item.quantity * item.rate)}</td>
    </tr>
  `).join('');

  win.document.write(`<!DOCTYPE html><html><head><title>${invoice.number}</title>
    <style>
      body{font-family:Inter,system-ui,sans-serif;color:#1E293B;padding:32px;margin:0}
      h1{color:#2E6DB4;margin:0}
      table{width:100%;border-collapse:collapse;margin:24px 0}
      th{text-align:left;padding:8px;border-bottom:2px solid #CBD5E1;background:#F8FAFC}
      .totals{margin-left:auto;width:220px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      .total-row{font-weight:700;font-size:16px;border-top:1px solid #E2E8F0;padding-top:8px;margin-top:8px}
      @media print{body{padding:0}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid #E2E8F0;padding-bottom:16px;margin-bottom:24px">
      <div>
        <h1>${company?.companyName || 'Vastora Tech'}</h1>
        ${company?.address ? `<p style="color:#64748B;margin:4px 0">${company.address}</p>` : ''}
        ${company?.taxId ? `<p style="color:#64748B">GSTIN: ${company.taxId}</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="font-size:18px;font-weight:700;margin:0">${invoice.type}</p>
        <p style="font-weight:600">${invoice.number}</p>
        <p style="color:#64748B">Status: ${invoice.status}</p>
      </div>
    </div>
    <p><strong>Bill to:</strong> ${invoice.clientName || '—'}</p>
    <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="totals">
      <div><span>Subtotal</span><span>${formatINR(invoice.subtotal)}</span></div>
      <div><span>Tax (${invoice.taxRate}%)</span><span>${formatINR(invoice.taxAmount)}</span></div>
      <div class="total-row"><span>Total</span><span>${formatINR(invoice.total)}</span></div>
    </div>
    ${invoice.notes ? `<p style="margin-top:32px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
};

export default InvoicePrintView;
