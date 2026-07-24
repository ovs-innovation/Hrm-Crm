import React from 'react';

const VastoraLogo = ({ className = 'h-11 w-auto max-w-[200px] object-contain', alt = 'Vastora Tech' }) => (
  <img src="/vastora-logo.png" alt={alt} className={className} />
);

export default VastoraLogo;
