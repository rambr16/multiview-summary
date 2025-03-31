
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Processing file..." 
}) => {
  return (
    <div className="flex flex-col justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
