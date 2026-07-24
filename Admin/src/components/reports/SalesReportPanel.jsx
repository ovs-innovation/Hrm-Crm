import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STAGE_COLORS = {
  Qualification: 'bg-slate-400',
  Proposal: 'bg-brand-light',
  Negotiation: 'bg-brand',
  'Closed Won': 'bg-success',
  'Closed Lost': 'bg-danger',
};

const REPORT_GUIDES = {
  'sales-overview': {
    title: 'How to read this report',
    body: 'Sales overview combines pipeline health, lead aging, and account revenue in one place. Weighted pipeline applies win probability by stage so forecast is more realistic than raw deal value.',
  },
  pipeline: {
    title: 'Pipeline report',
    body: 'Each row is an opportunity. Days open counts from creation. Overdue means expected close date passed while still in an open stage. Weighted value = amount × stage probability (Qualification 20%, Proposal 50%, Negotiation 75%).',
  },
  leads: {
    title: 'Lead register',
    body: 'Leads are unconverted prospects. Stale leads (30+ days) need follow-up. Linked deals shows if a lead already has opportunities attached before account conversion.',
  },
  accounts: {
    title: 'Account list',
    body: 'Active accounts are paying or engaged customers. Open pipeline and won revenue are rolled up from all deals linked to the account.',
  },
};

export const SalesReportPanel = ({ salesData, activeId }) => {
  if (!salesData?.summary) return null;

  const { summary, stageBreakdown } = salesData;
  const guide = REPORT_GUIDES[activeId];

  return (
    <div className="space-y-4 border-b border-line bg-canvas/40 p-4">
      {guide && (
        <div className="flex gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3">
          <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <div>
            <p className="text-[13px] font-semibold text-ink">{guide.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{guide.body}</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Open pipeline</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatINR(summary.pipelineValue)}</p>
          <p className="mt-1 text-[11px] text-muted">Weighted forecast {formatINR(summary.weightedPipeline)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Revenue won</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-success">{formatINR(summary.revenueWon)}</p>
          <p className="mt-1 text-[11px] text-muted">Win rate {summary.winRate}% · avg cycle {summary.avgWonCycleDays}d</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Leads</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{summary.totalLeads}</p>
          <p className="mt-1 text-[11px] text-muted">
            {summary.staleLeads} stale · {summary.leadsWithDeals} with deals
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Accounts</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{summary.totalAccounts}</p>
          <p className="mt-1 text-[11px] text-muted">{summary.conversionHint}</p>
        </div>
      </div>

      {(summary.overdueDeals > 0 || summary.staleLeads > 0) && (
        <div className="flex flex-wrap gap-2">
          {summary.overdueDeals > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-red-50 px-3 py-1 text-[12px] font-medium text-danger">
              <FiAlertCircle className="h-3.5 w-3.5" />
              {summary.overdueDeals} overdue deal{summary.overdueDeals > 1 ? 's' : ''}
            </span>
          )}
          {summary.staleLeads > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-amber-50 px-3 py-1 text-[12px] font-medium text-amber-800">
              <FiAlertCircle className="h-3.5 w-3.5" />
              {summary.staleLeads} lead{summary.staleLeads > 1 ? 's' : ''} need follow-up (30+ days)
            </span>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink">Stage breakdown</p>
          <Link to="/crm/deals" className="text-[11px] font-medium text-brand hover:underline">Manage deals</Link>
        </div>
        <div className="grid gap-2 lg:grid-cols-5">
          {(stageBreakdown || []).map((row) => (
            <div key={row.stage} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[row.stage] || 'bg-brand'}`} />
                <span className="text-[12px] font-medium text-ink">{row.stage}</span>
                <span className="ml-auto text-[10px] text-muted">{row.probability}</span>
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums text-ink">{row.count}</p>
              <p className="text-[11px] tabular-nums text-muted">{formatINR(row.value)}</p>
              <p className="mt-2 text-[10px] leading-snug text-muted">{row.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { formatINR, STAGE_COLORS };
