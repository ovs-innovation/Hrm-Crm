import React from 'react';

const Card = ({ children, className = '', title, footer, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
