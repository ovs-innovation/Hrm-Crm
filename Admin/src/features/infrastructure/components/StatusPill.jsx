import React from 'react';

const STYLES = {
  online: 'bg-emerald-50 text-emerald-700',
  running: 'bg-emerald-50 text-emerald-700',
  success: 'bg-emerald-50 text-emerald-700',
  healthy: 'bg-emerald-50 text-emerald-700',
  valid: 'bg-emerald-50 text-emerald-700',
  offline: 'bg-rose-50 text-rose-700',
  failed: 'bg-rose-50 text-rose-700',
  expired: 'bg-rose-50 text-rose-700',
  critical: 'bg-rose-50 text-rose-700',
  slow: 'bg-amber-50 text-amber-700',
  warning: 'bg-amber-50 text-amber-700',
  expiring: 'bg-amber-50 text-amber-700',
  expiring_soon: 'bg-amber-50 text-amber-700',
  degraded: 'bg-amber-50 text-amber-700',
  restarting: 'bg-brand/10 text-brand',
  maintenance: 'bg-soft text-muted',
  stopped: 'bg-soft text-muted',
  unknown: 'bg-soft text-muted',
  info: 'bg-brand/10 text-brand',
};

export default function StatusPill({ value }) {
  const key = String(value || 'unknown').toLowerCase();
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${STYLES[key] || STYLES.unknown}`}>
      {String(value || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}
