
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Processing file...",
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-t-4 border-b-4",
    lg: "h-16 w-16 border-t-4 border-b-4"
  };
  
  return (
    <div className="flex flex-col justify-center items-center py-8">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-primary`}></div>
      {message && <p className="mt-3 text-sm text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
