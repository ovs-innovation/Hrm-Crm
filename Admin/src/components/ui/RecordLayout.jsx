import React, { useState } from 'react';

const TABS = ['Overview', 'Timeline', 'Comments', 'Files', 'Audit'];

/** One record shell. Pass tab content by name. AI sits beside the tabs. */
const RecordLayout = ({ title, subtitle, status, actions, overview, timeline, comments, files, audit, ai }) => {
  const [tab, setTab] = useState('Overview');
  const body = { Overview: overview, Timeline: timeline, Comments: comments, Files: files, Audit: audit };

  return (
    <div className="mx-auto grid max-w-[1280px] gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-8">
      <div className="min-w-0">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="text-[20px] font-semibold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {status && <span className="rounded border border-line px-2 py-1 text-[12px] text-ink">{status}</span>}
            {actions}
          </div>
        </header>
        <div className="mt-4 flex gap-1 border-b border-line">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`h-9 px-3 text-[13px] ${tab === name ? 'border-b-2 border-brand font-medium text-ink' : 'text-muted'}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="py-4">{body[tab] || <p className="text-[13px] text-muted">Nothing here yet.</p>}</div>
      </div>
      <aside className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[13px] font-semibold text-ink">AI</h2>
        <div className="mt-3 text-[13px] text-muted">{ai || 'Open a record to ask about it.'}</div>
      </aside>
    </div>
  );
};

export default RecordLayout;
