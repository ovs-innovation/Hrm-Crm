import React from 'react';

const VastoraLogo = ({
  variant = 'wordmark',
  className,
  alt = 'Vastora Tech',
}) => {
  if (variant === 'header') {
    return (
      <span className={`inline-flex items-center gap-2 ${className || ''}`} role="img" aria-label={alt}>
        <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
        <span className="text-[18px] font-semibold leading-none tracking-tight">
          <span className="text-[#2E6DB4]">Vastora</span>
          <span className="text-[#3D4D5C]">Tech</span>
        </span>
      </span>
    );
  }

  const src = variant === 'mark' ? '/logo.png' : '/logowithname.png';
  const fallback =
    variant === 'mark'
      ? 'h-9 w-9 object-contain'
      : 'h-10 w-auto max-w-[200px] object-contain object-left';
  return <img src={src} alt={alt} className={className || fallback} />;
};

export default VastoraLogo;
