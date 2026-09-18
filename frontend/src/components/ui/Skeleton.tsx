import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {},
  ...rest
}) => {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      {...rest}
    />
  );
};

export default Skeleton;
