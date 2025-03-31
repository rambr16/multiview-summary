
import React from "react";
import { FileSpreadsheet } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-blue-100 p-3 mb-4">
        <FileSpreadsheet className="h-10 w-10 text-blue-600" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
