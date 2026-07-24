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
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="app-label mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        type={type}
        className={`app-input disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-danger ring-2 ring-danger/20' : ''
        }`}
        {...props}
      />
      {error && <span className="mt-1 text-sm text-danger">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
