import React from 'react';
import './Container.scss';

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'content' | 'wide' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'content',
  className = '',
}) => {
  const classes = [
    'container',
    `container--${maxWidth}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="container__content">
        {children}
      </div>
    </div>
  );
};
