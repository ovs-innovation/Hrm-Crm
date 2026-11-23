import React from 'react';

/** Lightweight SVG sparkline — no chart library dependency. */
export default function InfraSparkline({ points = [], height = 48, stroke = '#2E6DB4' }) {
  if (!points.length) {
    return <div className="flex h-12 items-center text-[12px] text-muted">No samples yet</div>;
  }
  const values = points.map((p) => Number(p.v) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 240;
  const h = height;
  const path = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}
