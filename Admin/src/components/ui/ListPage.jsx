import React from 'react';

/** Shared list chrome. Pages pass their table as children. */
const ListPage = ({ title, search, onSearch, filters, views, onCreate, createLabel = 'Create', onExport, children, footer }) => (
  <div className="mx-auto max-w-[1280px] space-y-4 p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[18px] font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-2">
        {onExport && (
          <button type="button" onClick={onExport} className="h-8 rounded border border-line bg-surface px-3 text-[13px] text-ink">Export</button>
        )}
        {onCreate && (
          <button type="button" onClick={onCreate} className="h-8 rounded bg-brand px-3 text-[13px] font-medium text-white">{createLabel}</button>
        )}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={search || ''}
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder="Search"
        className="h-8 w-full max-w-xs rounded border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-brand sm:w-64"
      />
      {filters}
      {views}
    </div>
    <div className="overflow-hidden rounded-lg border border-line bg-surface">{children}</div>
    {footer && <div className="flex justify-end text-[13px] text-muted">{footer}</div>}
  </div>
);

export default ListPage;
