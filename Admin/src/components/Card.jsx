import React from 'react';

const Card = ({ children, className = '', title, footer, ...props }) => {
  return (
    <div className={`app-card ${className}`} {...props}>
      {title && (
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="rounded-b-lg border-t border-line bg-canvas px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
