
import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-3 text-sm text-gray-500">Processing file...</p>
    </div>
  );
};

export default LoadingSpinner;
