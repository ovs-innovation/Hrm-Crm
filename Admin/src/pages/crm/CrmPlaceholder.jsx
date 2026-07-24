import React from 'react';
import { Link } from 'react-router-dom';

const CrmPlaceholder = ({ title, description }) => (
  <div className="mx-auto max-w-[1280px] p-6 lg:p-8">
    <div className="rounded border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
      </div>
      <div className="px-4 py-12 text-center">
        <p className="mx-auto max-w-md text-[13px] leading-relaxed text-muted">
          {description || 'This view is under development. Core list and detail screens will follow the same layout patterns as Home and Accounts.'}
        </p>
        <Link to="/" className="btn-outline mt-6 inline-flex px-3 py-2 text-[13px]">
          Back to Home
        </Link>
      </div>
    </div>
  </div>
);

export default CrmPlaceholder;
