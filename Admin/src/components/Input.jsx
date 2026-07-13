import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label htmlFor={inputId} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        type={type}
        className={`
          w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm 
          placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500
          disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="mt-1 text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
