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
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`app-input appearance-none ${
          error ? 'border-brand ring-2 ring-brand/20' : ''
        }`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 text-sm text-brand">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
