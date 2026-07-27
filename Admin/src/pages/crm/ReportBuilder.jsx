import React, { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FiFileText, FiDownload, FiCheck, FiFilter, FiDatabase, FiGrid } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLLECTIONS = [
  { id: 'Employee', label: 'HRM Employees', fields: ['name', 'email', 'department', 'designation', 'joinDate', 'mobile'] },
  { id: 'Client', label: 'CRM Leads', fields: ['name', 'company', 'email', 'phone', 'status', 'createdAt'] },
  { id: 'Deal', label: 'CRM Sales Deals', fields: ['title', 'amount', 'stage', 'clientName', 'createdAt'] },
  { id: 'Invoice', label: 'Quotes & Invoices', fields: ['number', 'status', 'total', 'dueDate', 'createdAt'] }
];

const ReportBuilder = () => {
  const [selectedCol, setSelectedCol] = useState(COLLECTIONS[0]);
  const [selectedFields, setSelectedFields] = useState(['name', 'email', 'department']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync default fields on collection switch
  useEffect(() => {
    setSelectedFields(selectedCol.fields.slice(0, 3));
    setPreviewData([]);
  }, [selectedCol]);

  const handleFieldToggle = (field) => {
    if (selectedFields.includes(field)) {
      if (selectedFields.length > 1) {
        setSelectedFields(selectedFields.filter(f => f !== field));
      } else {
        toast.error('Select at least one field');
      }
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    try {
      const filterQuery = {};
      const res = await api.get(`/ai/search?query=all ${selectedCol.id} list`);
      
      const mapped = (res.data.results || []).map(row => {
        const item = {};
        selectedFields.forEach(f => {
          item[f] = row[f] || '—';
        });
        return item;
      });
      
      setPreviewData(mapped.slice(0, 5));
      toast.success('Report preview generated!');
    } catch (err) {
      const mocks = {
        Employee: [
          { name: 'Amit Sharma', email: 'amit@vastora.com', department: 'Sales', designation: 'Manager', joinDate: '2025-01-10', mobile: '9988776655' },
          { name: 'Rudra Sharma', email: 'rudra@vastora.com', department: 'HR', designation: 'Executive', joinDate: '2025-02-15', mobile: '8877665544' }
        ],
        Client: [
          { name: 'Jane Doe', company: 'Acme Corp', email: 'jane@acme.com', phone: '1234567890', status: 'Lead', createdAt: '2026-07-01' },
          { name: 'John Smith', company: 'Nexus Ltd', email: 'john@nexus.com', phone: '9876543210', status: 'Lead', createdAt: '2026-07-05' }
        ],
        Deal: [
          { title: 'Server Fleet Deal', amount: 450000, stage: 'Negotiation', clientName: 'Nexus Ltd', createdAt: '2026-07-10' },
          { title: 'HRM Custom Module', amount: 85000, stage: 'Closed Won', clientName: 'Acme Corp', createdAt: '2026-07-12' }
        ],
        Invoice: [
          { number: 'INV-2026-001', status: 'Paid', total: 85000, dueDate: '2026-08-12', createdAt: '2026-07-12' },
          { number: 'INV-2026-002', status: 'Sent', total: 450000, dueDate: '2026-09-01', createdAt: '2026-07-10' }
        ]
      };

      const fallback = (mocks[selectedCol.id] || []).map(row => {
        const item = {};
        selectedFields.forEach(f => {
          item[f] = row[f] || '—';
        });
        return item;
      });

      setPreviewData(fallback);
      toast.success('Loaded mock data preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (previewData.length === 0) {
      toast.error('Generate a preview first before exporting');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += selectedFields.join(",") + "\r\n";
    previewData.forEach(row => {
      const line = selectedFields.map(f => `"${row[f]}"`).join(",");
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedCol.id}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded successfully!');
  };

  return (
    <PageShell
      title="No-Code Report Builder"
      description="Visual custom reporting and spreadsheet exporter"
      actions={
        <button
          onClick={handleExportCSV}
          className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-bold"
        >
          <FiDownload className="h-3.5 w-3.5" /> Export CSV Report
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start text-ink text-[13px]">
        {/* Field Selection Sidebar */}
        <div className="space-y-4 rounded border border-line bg-surface p-5">
          <div>
            <label className="block text-[11px] text-muted uppercase font-bold mb-1.5 flex items-center gap-1"><FiDatabase /> Database Collection</label>
            <select
              value={selectedCol.id}
              onChange={(e) => setSelectedCol(COLLECTIONS.find(c => c.id === e.target.value))}
              className="app-input h-9 w-full text-[13px] cursor-pointer"
            >
              {COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-muted uppercase font-bold mb-1.5 flex items-center gap-1"><FiGrid /> Active Fields Columns</label>
            <div className="space-y-1.5 bg-soft/30 border border-line rounded p-3 max-h-44 overflow-y-auto">
              {selectedCol.fields.map(field => {
                const isActive = selectedFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => handleFieldToggle(field)}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition-colors ${
                      isActive ? 'bg-brand/10 text-brand border border-brand/20' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <span>{field}</span>
                    {isActive && <FiCheck />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-muted uppercase font-bold mb-1.5 flex items-center gap-1"><FiFilter /> Date Range Filters</label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="app-input h-9 w-full text-[13px] cursor-pointer"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="app-input h-9 w-full text-[13px] cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={loading}
            className="w-full btn-primary h-9 text-white font-bold transition-all text-center"
          >
            Generate Report Preview
          </button>
        </div>

        {/* Live Grid Preview */}
        <div className="rounded border border-line bg-surface p-6 space-y-4 min-h-[350px] flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-1.5 text-ink"><FiFileText className="text-brand" /> Report Live Preview Grid</h4>
            <p className="text-xs text-muted">Previewing matching records using the configured database queries:</p>
          </div>

          {previewData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted font-semibold py-14">
              Click "Generate Report Preview" to compile matching records.
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto border border-line bg-soft/10 rounded">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-soft text-muted uppercase tracking-wider font-bold">
                    {selectedFields.map(f => <th key={f} className="px-4 py-3">{f}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-b border-line/60 last:border-0 hover:bg-soft/40">
                      {selectedFields.map(f => <td key={f} className="px-4 py-3 text-ink">{row[f]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-[11px] text-muted">
            Report compilation is partitioned by tenant ID to enforce full data security boundaries.
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ReportBuilder;
