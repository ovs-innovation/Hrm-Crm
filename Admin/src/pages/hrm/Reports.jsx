import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiCheckSquare,
  FiDownload,
  FiFileText,
  FiLifeBuoy,
  FiPieChart,
  FiRefreshCw,
  FiTarget,
  FiUsers,
  FiDollarSign,
} from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import { SalesReportPanel, formatINR, STAGE_COLORS } from '../../components/reports/SalesReportPanel';
import api from '../../services/api';

const SALES_REPORT_IDS = ['sales-overview', 'pipeline', 'leads', 'accounts'];

const CATALOG = [
  {
    category: 'Sales',
    reports: [
      { id: 'sales-overview', title: 'Sales overview', desc: 'Full pipeline snapshot with stage guide', icon: FiPieChart },
      { id: 'pipeline', title: 'Pipeline report', desc: 'Deals with forecast, aging & close dates', icon: FiDollarSign },
      { id: 'leads', title: 'Lead register', desc: 'Prospects, age, follow-up status & linked deals', icon: FiTarget },
      { id: 'accounts', title: 'Account revenue', desc: 'Customers with open & won deal roll-up', icon: FiUsers },
    ],
  },
  {
    category: 'Human Resources',
    reports: [
      { id: 'attendance', title: 'Attendance register', desc: 'Check-in/out by employee', icon: FiCalendar },
      { id: 'leaves', title: 'Leave register', desc: 'All leave requests & status', icon: FiCalendar },
      { id: 'payroll', title: 'Payroll summary', desc: 'Payslips for selected month', icon: FiDollarSign },
      { id: 'employees', title: 'Employee directory', desc: 'Staff list with roles', icon: FiUsers },
      { id: 'daily', title: 'Daily work reports', desc: 'End-of-day employee updates', icon: FiFileText },
    ],
  },
  {
    category: 'Operations',
    reports: [
      { id: 'tickets', title: 'Support tickets', desc: 'IT & HR ticket log', icon: FiLifeBuoy },
      { id: 'tasks', title: 'Task summary', desc: 'Open and completed tasks', icon: FiCheckSquare },
    ],
  },
];

const downloadCsv = (filename, headers, rows) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

const ReportTable = ({ columns, rows, emptyMessage }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left text-[13px]">
      <thead>
        <tr className="border-b border-line bg-soft text-muted">
          {columns.map((col) => (
            <th key={col.key} className={`px-4 py-2.5 font-medium ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted">{emptyMessage}</td></tr>
        ) : rows.map((row, i) => (
          <tr key={row._id || row.id || i} className="border-b border-line last:border-0 hover:bg-soft/50">
            {columns.map((col) => (
              <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.muted ? 'text-muted' : 'text-ink'}`}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Reports = () => {
  const [activeId, setActiveId] = useState('sales-overview');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeMeta = useMemo(
    () => CATALOG.flatMap((g) => g.reports).find((r) => r.id === activeId),
    [activeId]
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      if (SALES_REPORT_IDS.includes(activeId)) {
        const res = await api.get('/dashboard/sales-detail');
        setSalesData(res.data);
        if (activeId === 'pipeline') setRows(res.data.deals || []);
        else if (activeId === 'leads') setRows(res.data.leads || []);
        else if (activeId === 'accounts') setRows(res.data.accounts || []);
        else setRows([]);
        return;
      }

      setSalesData(null);
      let data = [];
      switch (activeId) {
        case 'attendance': {
          const res = await api.get(`/attendance?month=${month}`);
          data = res.data;
          break;
        }
        case 'leaves': {
          const res = await api.get('/leaves');
          data = res.data;
          break;
        }
        case 'payroll': {
          const res = await api.get(`/payslips?month=${month}`);
          data = res.data;
          break;
        }
        case 'employees': {
          const res = await api.get('/employees');
          data = res.data;
          break;
        }
        case 'daily': {
          const res = await api.get('/reports');
          data = res.data;
          break;
        }
        case 'tickets': {
          const res = await api.get('/tickets');
          data = res.data;
          break;
        }
        case 'tasks': {
          const res = await api.get('/tasks');
          data = res.data;
          break;
        }
        default:
          break;
      }
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeId, month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const filtered = useMemo(() => {
    let list = rows;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
    }
    if (stageFilter && activeId === 'pipeline') {
      list = list.filter((r) => r.stage === stageFilter);
    }
    if (ownerFilter && activeId === 'pipeline') {
      list = list.filter((r) => r.owner === ownerFilter);
    }
    if (overdueOnly && activeId === 'pipeline') {
      list = list.filter((r) => r.isOverdue);
    }
    if (staleOnly && activeId === 'leads') {
      list = list.filter((r) => r.isStale);
    }
    if (statusFilter) {
      list = list.filter((r) => (r.status || '') === statusFilter);
    }
    return list;
  }, [rows, search, stageFilter, statusFilter, ownerFilter, overdueOnly, staleOnly, activeId]);

  const tableConfig = useMemo(() => {
    switch (activeId) {
      case 'sales-overview':
        return { columns: [], exportHeaders: [], exportRows: () => [], filename: 'sales-overview.csv' };
      case 'pipeline':
        return {
          columns: [
            { key: 'title', label: 'Deal' },
            { key: 'clientName', label: 'Account', muted: true },
            {
              key: 'stage',
              label: 'Stage',
              render: (r) => (
                <div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${STAGE_COLORS[r.stage] || 'bg-brand'}`}>{r.stage}</span>
                  <p className="mt-1 max-w-[140px] text-[10px] leading-snug text-muted">{r.stageHint}</p>
                </div>
              ),
            },
            { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatINR(r.amount) },
            { key: 'weightedAmount', label: 'Weighted', align: 'right', muted: true, render: (r) => `${formatINR(r.weightedAmount)} (${r.stageProbability})` },
            { key: 'expectedCloseLabel', label: 'Expected close', muted: true, render: (r) => r.expectedCloseLabel || '—' },
            {
              key: 'daysOpen',
              label: 'Age',
              render: (r) => (
                <div>
                  <span className="tabular-nums">{r.daysOpen}d open</span>
                  {r.isOverdue && <p className="text-[10px] font-medium text-danger">Overdue</p>}
                </div>
              ),
            },
            { key: 'owner', label: 'Owner', muted: true },
          ],
          exportHeaders: ['Deal', 'Account', 'Stage', 'Amount', 'Weighted', 'Probability', 'Expected close', 'Days open', 'Overdue', 'Owner', 'Notes'],
          exportRows: (list) => list.map((r) => [r.title, r.clientName, r.stage, r.amount, r.weightedAmount, r.stageProbability, r.expectedCloseLabel, r.daysOpen, r.isOverdue ? 'Yes' : 'No', r.owner, r.notes]),
          filename: 'pipeline-report.csv',
        };
      case 'leads':
        return {
          columns: [
            { key: 'name', label: 'Contact' },
            { key: 'company', label: 'Company', muted: true },
            { key: 'email', label: 'Email', muted: true },
            { key: 'phone', label: 'Phone', muted: true },
            {
              key: 'ageLabel',
              label: 'Lead age',
              render: (r) => (
                <div>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${r.isStale ? 'bg-amber-50 text-amber-800' : 'bg-soft text-muted'}`}>{r.staleLabel}</span>
                  <p className="mt-0.5 text-[10px] text-muted">{r.ageLabel}</p>
                </div>
              ),
            },
            { key: 'dealCount', label: 'Linked deals', align: 'right', render: (r) => r.dealCount || 0 },
            { key: 'openPipelineValue', label: 'Pipeline', align: 'right', muted: true, render: (r) => r.openPipelineValue ? formatINR(r.openPipelineValue) : '—' },
            { key: 'notes', label: 'Notes', muted: true, render: (r) => <span className="line-clamp-2 max-w-[160px]">{r.notes || '—'}</span> },
          ],
          exportHeaders: ['Name', 'Company', 'Email', 'Phone', 'Age days', 'Status', 'Linked deals', 'Open pipeline', 'Notes'],
          exportRows: (list) => list.map((r) => [r.name, r.company, r.email, r.phone, r.ageDays, r.staleLabel, r.dealCount, r.openPipelineValue, r.notes]),
          filename: 'lead-register.csv',
        };
      case 'accounts':
        return {
          columns: [
            { key: 'company', label: 'Account' },
            { key: 'name', label: 'Primary contact', muted: true },
            { key: 'status', label: 'Status', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span> },
            { key: 'customerSinceLabel', label: 'Customer since', muted: true },
            { key: 'dealCount', label: 'Deals', align: 'right' },
            { key: 'openPipelineValue', label: 'Open pipeline', align: 'right', render: (r) => formatINR(r.openPipelineValue) },
            { key: 'wonRevenue', label: 'Won revenue', align: 'right', render: (r) => <span className="font-medium text-success">{formatINR(r.wonRevenue)}</span> },
            { key: 'wonDeals', label: 'Won / Lost', align: 'right', muted: true, render: (r) => `${r.wonDeals} / ${r.lostDeals}` },
          ],
          exportHeaders: ['Company', 'Contact', 'Email', 'Phone', 'Status', 'Customer since', 'Deals', 'Open pipeline', 'Won revenue', 'Won', 'Lost'],
          exportRows: (list) => list.map((r) => [r.company, r.name, r.email, r.phone, r.status, r.customerSinceLabel, r.dealCount, r.openPipelineValue, r.wonRevenue, r.wonDeals, r.lostDeals]),
          filename: 'account-revenue-report.csv',
        };
      case 'attendance':
        return {
          columns: [
            { key: 'employeeId', label: 'Employee ID' },
            { key: 'date', label: 'Date', muted: true },
            { key: 'checkIn', label: 'Check in', render: (r) => r.checkIn || '—' },
            { key: 'checkOut', label: 'Check out', render: (r) => r.checkOut || '—' },
            { key: 'workMode', label: 'Mode', muted: true, render: (r) => r.workMode || '—' },
          ],
          exportHeaders: ['Employee ID', 'Date', 'Check in', 'Check out', 'Mode', 'Status'],
          exportRows: (list) => list.map((r) => [r.employeeId, r.date, r.checkIn, r.checkOut, r.workMode, r.status]),
          filename: `attendance-${month}.csv`,
        };
      case 'leaves':
        return {
          columns: [
            { key: 'employee', label: 'Employee' },
            { key: 'type', label: 'Type', muted: true },
            { key: 'startDate', label: 'From' },
            { key: 'endDate', label: 'To' },
            { key: 'status', label: 'Status', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span> },
          ],
          exportHeaders: ['Employee', 'Type', 'From', 'To', 'Status', 'Reason'],
          exportRows: (list) => list.map((r) => [r.employee, r.type, r.startDate, r.endDate, r.status, r.reason]),
          filename: 'leave-register.csv',
        };
      case 'payroll':
        return {
          columns: [
            { key: 'employeeName', label: 'Employee' },
            { key: 'employeeId', label: 'ID', muted: true },
            { key: 'month', label: 'Month' },
            { key: 'basicSalary', label: 'Basic', align: 'right', render: (r) => formatINR(r.basicSalary) },
            { key: 'netPay', label: 'Net pay', align: 'right', render: (r) => formatINR(r.netPay) },
            { key: 'status', label: 'Status', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span> },
          ],
          exportHeaders: ['Employee', 'ID', 'Month', 'Basic', 'Allowances', 'Deductions', 'Net', 'Status'],
          exportRows: (list) => list.map((r) => [r.employeeName, r.employeeId, r.month, r.basicSalary, r.allowances, r.deductions, r.netPay, r.status]),
          filename: `payroll-${month}.csv`,
        };
      case 'employees':
        return {
          columns: [
            { key: 'employeeId', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email', muted: true },
            { key: 'department', label: 'Department', muted: true },
            { key: 'designation', label: 'Designation', muted: true },
            { key: 'role', label: 'Role', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.role}</span> },
          ],
          exportHeaders: ['ID', 'Name', 'Email', 'Department', 'Designation', 'Role'],
          exportRows: (list) => list.map((r) => [r.employeeId, r.name, r.email, r.department, r.designation, r.role]),
          filename: 'employee-directory.csv',
        };
      case 'daily':
        return {
          columns: [
            { key: 'employee', label: 'Employee', render: (r) => r.employeeId?.name || 'Unknown' },
            { key: 'date', label: 'Date', muted: true, render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
            { key: 'reportText', label: 'Summary', muted: true, render: (r) => <span className="line-clamp-2 max-w-md">{r.reportText}</span> },
          ],
          exportHeaders: ['Employee', 'Date', 'Report'],
          exportRows: (list) => list.map((r) => [r.employeeId?.name, r.date, r.reportText]),
          filename: 'daily-work-reports.csv',
        };
      case 'tickets':
        return {
          columns: [
            { key: 'title', label: 'Subject' },
            { key: 'createdByName', label: 'Raised by', muted: true },
            { key: 'category', label: 'Category', muted: true },
            { key: 'priority', label: 'Priority', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.priority}</span> },
            { key: 'status', label: 'Status', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span> },
          ],
          exportHeaders: ['Subject', 'Raised by', 'Category', 'Priority', 'Status'],
          exportRows: (list) => list.map((r) => [r.title, r.createdByName, r.category, r.priority, r.status]),
          filename: 'support-tickets.csv',
        };
      case 'tasks':
        return {
          columns: [
            { key: 'title', label: 'Task' },
            { key: 'assignedTo', label: 'Assignee', muted: true },
            { key: 'projectName', label: 'Project', muted: true },
            { key: 'dueDate', label: 'Due', muted: true },
            { key: 'status', label: 'Status', render: (r) => <span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span> },
          ],
          exportHeaders: ['Task', 'Assignee', 'Project', 'Due', 'Status', 'Priority'],
          exportRows: (list) => list.map((r) => [r.title, r.assignedTo, r.projectName, r.dueDate, r.status, r.priority]),
          filename: 'task-summary.csv',
        };
      default:
        return { columns: [], exportHeaders: [], exportRows: () => [], filename: 'report.csv' };
    }
  }, [activeId, month]);

  const handleExport = () => {
    if (!tableConfig.exportRows) return;
    downloadCsv(tableConfig.filename, tableConfig.exportHeaders, tableConfig.exportRows(filtered));
  };

  const showMonth = ['attendance', 'payroll'].includes(activeId);
  const showStage = activeId === 'pipeline';
  const showOwner = activeId === 'pipeline';
  const showOverdue = activeId === 'pipeline';
  const showStale = activeId === 'leads';
  const showStatus = ['leaves', 'tickets', 'tasks', 'payroll', 'accounts'].includes(activeId);
  const isSalesReport = SALES_REPORT_IDS.includes(activeId);

  const statusOptions = {
    leaves: ['Pending', 'Approved', 'Rejected'],
    tickets: ['Open', 'In Progress', 'Resolved', 'Closed'],
    tasks: ['Pending', 'In Progress', 'Completed'],
    payroll: ['Draft', 'Paid'],
    accounts: ['Active', 'Inactive'],
  };

  const overviewSections = salesData ? [
    {
      title: 'Deals needing attention (overdue close)',
      rows: (salesData.deals || []).filter((d) => d.isOverdue).slice(0, 5),
      empty: 'No overdue deals — pipeline is on track.',
      cols: ['title', 'clientName', 'stage', 'expectedCloseLabel', 'amount'],
    },
    {
      title: 'Stale leads (30+ days without conversion)',
      rows: (salesData.leads || []).filter((l) => l.isStale).slice(0, 5),
      empty: 'No stale leads — follow-up is current.',
      cols: ['name', 'company', 'ageLabel', 'dealCount'],
    },
    {
      title: 'Top accounts by won revenue',
      rows: [...(salesData.accounts || [])].sort((a, b) => b.wonRevenue - a.wonRevenue).slice(0, 5),
      empty: 'No won revenue recorded yet.',
      cols: ['company', 'wonDeals', 'wonRevenue', 'openPipelineValue'],
    },
  ] : [];

  return (
    <PageShell
      title="Reports"
      description="Detailed registers and exportable data — for audits, payroll, and sales review"
      count={filtered.length}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={fetchReport} className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={handleExport} disabled={!filtered.length || activeId === 'sales-overview'} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px] disabled:opacity-50">
            <FiDownload className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-soft/80 px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <FiPieChart className="h-4 w-4" />
          Need charts & trends? Use Analytics for visual dashboards.
        </div>
        <Link to="/analytics" className="shrink-0 text-[13px] font-medium text-brand hover:underline">Open Analytics →</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Report catalog */}
        <aside className="rounded-lg border border-line bg-surface p-2 lg:sticky lg:top-4 lg:self-start">
          {CATALOG.map((group) => (
            <div key={group.category} className="mb-3 last:mb-0">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{group.category}</p>
              <div className="space-y-0.5">
                {group.reports.map((report) => {
                  const Icon = report.icon;
                  const active = activeId === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => {
                        setActiveId(report.id);
                        setSearch('');
                        setStageFilter('');
                        setStatusFilter('');
                        setOwnerFilter('');
                        setOverdueOnly(false);
                        setStaleOnly(false);
                      }}
                      className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition ${active ? 'bg-brand-xlight text-brand' : 'text-ink hover:bg-soft'}`}
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>
                        <span className="block text-[13px] font-medium leading-tight">{report.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{report.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Report viewer */}
        <div className="min-w-0 rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-semibold text-ink">{activeMeta?.title}</h2>
            <p className="mt-0.5 text-[12px] text-muted">{activeMeta?.desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas/50 px-4 py-3">
            {activeId !== 'sales-overview' && (
              <>
                <input
                  type="search"
                  placeholder="Search in report…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="app-input h-8 min-w-[180px] flex-1 text-[13px]"
                />
                {showMonth && (
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="app-input h-8 text-[13px]" />
                )}
                {showStage && (
                  <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="app-input h-8 text-[13px]">
                    <option value="">All stages</option>
                    {['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                {showOwner && (
                  <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="app-input h-8 text-[13px]">
                    <option value="">All owners</option>
                    {(salesData?.owners || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {showOverdue && (
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted">
                    <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="rounded border-line" />
                    Overdue only
                  </label>
                )}
                {showStale && (
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted">
                    <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} className="rounded border-line" />
                    Stale only (30d+)
                  </label>
                )}
                {showStatus && (
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="app-input h-8 text-[13px]">
                    <option value="">All statuses</option>
                    {(statusOptions[activeId] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <span className="ml-auto text-[12px] tabular-nums text-muted">{filtered.length} rows</span>
              </>
            )}
          </div>

          {isSalesReport && !loading && salesData && (
            <SalesReportPanel salesData={salesData} activeId={activeId} />
          )}

          {loading ? (
            <div className="px-4 py-16 text-center text-[13px] text-muted">Loading report data…</div>
          ) : activeId === 'sales-overview' && salesData ? (
            <div className="space-y-6 p-4">
              {overviewSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 text-[13px] font-semibold text-ink">{section.title}</h3>
                  {section.rows.length === 0 ? (
                    <p className="rounded-lg border border-line bg-soft px-4 py-6 text-center text-[12px] text-muted">{section.empty}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-line">
                      <table className="w-full text-left text-[13px]">
                        <tbody>
                          {section.rows.map((row) => (
                            <tr key={row._id} className="border-b border-line last:border-0 hover:bg-soft/50">
                              {section.cols.map((key) => (
                                <td key={key} className="px-4 py-2.5 text-ink">
                                  {key === 'amount' || key === 'wonRevenue' || key === 'openPipelineValue'
                                    ? formatINR(row[key])
                                    : row[key] ?? '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => setActiveId('pipeline')} className="btn-outline px-3 py-2 text-[12px]">Full pipeline →</button>
                <button type="button" onClick={() => setActiveId('leads')} className="btn-outline px-3 py-2 text-[12px]">All leads →</button>
                <Link to="/analytics" className="btn-primary px-3 py-2 text-[12px]">View charts in Analytics</Link>
              </div>
            </div>
          ) : (
            <ReportTable columns={tableConfig.columns} rows={filtered} emptyMessage="No records match your filters." />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Reports;
