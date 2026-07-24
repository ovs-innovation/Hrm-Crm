import React from 'react';

const PageShell = ({ title, description, count, actions, children, fullWidth }) => (
  <div className={fullWidth ? 'w-full' : 'mx-auto max-w-[1280px]'}>
    {(title || actions) && (
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {title && <h1 className="text-[15px] font-semibold text-ink">{title}</h1>}
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          {typeof count === 'number' && <p className="mt-1 text-[12px] text-muted">{count} records</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export default PageShell;
