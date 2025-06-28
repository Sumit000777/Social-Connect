import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  // Define size classes
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  
  // Define color classes
  const colorClasses = {
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    white: 'text-white'
  };
  
  // Get appropriate classes
  const spinnerSize = sizeClasses[size] || sizeClasses.medium;
  const spinnerColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-4 border-t-transparent ${spinnerSize} ${spinnerColor}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;