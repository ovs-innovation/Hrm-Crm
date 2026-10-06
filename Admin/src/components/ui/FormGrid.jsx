import React from 'react';

/** Two columns on desktop, one column below the lg breakpoint. */
const FormGrid = ({ children, onSubmit }) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {children}
  </form>
);

export default FormGrid;
