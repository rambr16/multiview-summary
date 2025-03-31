
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
