
// Helper function to format column names
export const formatColumnName = (column: string): string => {
  const specialNames: Record<string, string> = {
    'prr_vs_rr': 'PRR vs RR',
    'rr': 'RR',
    'bounce_rate': 'Bounce',
    'unique_leads_per_positive': 'Unique Leads/Positive'
  };

  if (specialNames[column]) return specialNames[column];
  return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to format cell values
export const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (value === 'no positive reply') return 'No positive reply';
  if (typeof value === 'number') return Number(value).toLocaleString();
  return String(value);
};

// Format percentages and special values
export const formatMetric = (key: string, value: any): string => {
  if (value === 'no positive reply') return 'No positive reply';
  
  if (['prr_vs_rr', 'rr', 'bounce_rate'].includes(key)) {
    return typeof value === 'number' ? `${value.toFixed(2)}%` : String(value);
  }
  
  if (key === 'unique_leads_per_positive' && typeof value === 'number') {
    return value.toFixed(2);
  }
  
  return formatCellValue(value);
};

// Function to determine highlight color based on metric values
export const getMetricHighlightColor = (key: string, value: any): string => {
  if (value === null || value === undefined || value === 'no positive reply') {
    return '';
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  // Don't highlight if we can't parse it as a number
  if (isNaN(numValue)) return '';
  
  // Apply conditional highlighting based on metric type
  switch(key) {
    // Bounce rate: > 3% is red, <= 3% is green
    case 'bounce_rate':
      return numValue > 3 ? 'text-red-600' : 'text-green-600';
    
    // PRR vs RR: < 10% is red, >= 10% is green
    case 'prr_vs_rr':
      return numValue < 10 ? 'text-red-600' : 'text-green-600';
    
    // Reply Rate: < 1% is red, >= 1% is green
    case 'rr':
      return numValue < 1 ? 'text-red-600' : 'text-green-600';
    
    // Unique Leads per Positive: > 1000 is red, <= 1000 is green
    case 'unique_leads_per_positive':
      return numValue > 1000 ? 'text-red-600' : 'text-green-600';
    
    default:
      return '';
  }
};

// Function to determine highlight background color for cards
export const getCardHighlightColor = (key: string, value: any): string => {
  if (value === null || value === undefined || value === 'no positive reply') {
    return '';
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  // Don't highlight if we can't parse it as a number
  if (isNaN(numValue)) return '';
  
  // Apply conditional highlighting based on metric type
  switch(key) {
    // Bounce rate: > 3% is red, <= 3% is green
    case 'bounce_rate':
      return numValue > 3 ? 'bg-red-50' : 'bg-green-50';
    
    // PRR vs RR: < 10% is red, >= 10% is green
    case 'prr_vs_rr':
      return numValue < 10 ? 'bg-red-50' : 'bg-green-50';
    
    // Reply Rate: < 1% is red, >= 1% is green
    case 'rr':
      return numValue < 1 ? 'bg-red-50' : 'bg-green-50';
    
    // Unique Leads per Positive: > 1000 is red, <= 1000 is green
    case 'unique_leads_per_positive':
      return numValue > 1000 ? 'bg-red-50' : 'bg-green-50';
    
    default:
      return '';
  }
};
