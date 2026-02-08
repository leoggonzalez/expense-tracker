import React from 'react';
import './Stack.scss';

export interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  gap = 0,
  align,
  justify,
  wrap = false,
  className = '',
}) => {
  const style: React.CSSProperties = {
    flexDirection: direction,
    gap: `${gap}px`,
    ...(align && { alignItems: align }),
    ...(justify && { justifyContent: justify }),
    ...(wrap && { flexWrap: 'wrap' }),
  };

  return (
    <div className={`stack ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};
