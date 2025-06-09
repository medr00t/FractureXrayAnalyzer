import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title, 
  subtitle,
  className = ''
}) => {
  return (
    <div className={`container mx-auto px-4 py-6 md:py-8 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6 md:mb-8">
          {title && <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageContainer;