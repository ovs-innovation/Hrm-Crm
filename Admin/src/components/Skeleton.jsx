import React from 'react';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/90 bg-surface ${className || ''}`}
      {...props}
    />
  );
};

export default Skeleton;
