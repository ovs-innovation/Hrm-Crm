import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  options = [],
  error,
  className = '',
  id,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label htmlFor={selectId} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`
          w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          dark:bg-slate-800 dark:border-slate-600 dark:text-white
          disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="mt-1 text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
