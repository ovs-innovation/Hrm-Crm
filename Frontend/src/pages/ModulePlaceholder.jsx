import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const ModulePlaceholder = ({ title, description, links = [] }) => (
  <PageShell title={title} description={description}>
    <div className="rounded border border-line bg-surface px-4 py-12 text-center">
      <p className="mx-auto max-w-md text-[13px] text-muted">{description || 'This module is not available yet.'}</p>
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="btn-outline px-3 py-2 text-[13px]">{l.label}</Link>
          ))}
        </div>
      )}
    </div>
  </PageShell>
);

export default ModulePlaceholder;
