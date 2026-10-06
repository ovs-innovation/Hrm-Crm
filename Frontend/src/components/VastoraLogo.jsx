import React from 'react';

const VastoraLogo = ({
  variant = 'wordmark',
  className = '',
  alt = 'Vastora Tech',
}) => {
  if (variant === 'mark') {
    return <img src="/logo.png" alt={alt} className={className || 'h-9 w-9 object-contain'} />;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label={alt}>
      <img src="/logo.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
      <span className="whitespace-nowrap text-[17px] font-semibold leading-none tracking-tight">
        <span className="text-brand">Vastora</span>
        <span className="text-[#3D4D5C]"> Tech</span>
      </span>
    </span>
  );
};

export default VastoraLogo;
