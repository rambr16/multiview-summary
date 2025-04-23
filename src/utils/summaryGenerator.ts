
import { DataRow } from './fileTypes';
import { addCalculatedMetrics } from './dataTransformer';

export const generateSummaryView = (filteredData: DataRow[]): DataRow[] => {
  if (!filteredData.length) return [];

  const columns = Object.keys(filteredData[0]);
  const numericColumns = columns.filter(col => 
    !['total_count', 'drafted_count', 'record_count', 'id', 'user_id'].includes(col.toLowerCase()) &&
    (typeof filteredData[0][col] === 'number' || 
     !isNaN(Number(filteredData[0][col])))
  );

  const clientField = columns.find(col => col.toLowerCase().includes('client')) || null;
  
  if (!clientField) {
    return generateOverallSummary(filteredData, numericColumns);
  } else {
    return generateClientSummaries(filteredData, numericColumns, clientField);
  }
};

const generateOverallSummary = (filteredData: DataRow[], numericColumns: string[]): DataRow[] => {
  const summary: DataRow = {};
  
  numericColumns.forEach(col => {
    // Skip calculation fields - we'll recalculate them using aggregate values
    if (['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col)) {
      return;
    }
    
    const sum = filteredData.reduce((acc, row) => {
      const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
      return acc + (val as number);
    }, 0);
    
    summary[col] = sum;
  });
  
  // Now calculate the summary metrics properly from aggregated data
  addCalculatedMetrics(summary);
  
  return [summary];
};

const generateClientSummaries = (
  filteredData: DataRow[], 
  numericColumns: string[], 
  clientField: string
): DataRow[] => {
  // Group by client
  const clientGroups: { [key: string]: DataRow } = {};
  
  filteredData.forEach(row => {
    const client = String(row[clientField] || 'Unknown');
    if (!clientGroups[client]) {
      clientGroups[client] = { 
        [clientField]: client
      };
      
      numericColumns.forEach(col => {
        if (!col.toLowerCase().includes('client') && 
            !['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col)) {
          clientGroups[client][col] = 0;
        }
      });
    }
    
    // Sum numeric columns (excluding the calculated metrics)
    numericColumns.forEach(col => {
      if (col.toLowerCase().includes('client') || 
          ['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col)) {
        return;
      }
      
      // Ensure we're correctly handling the positive reply count
      let val = 0;
      if (col.toLowerCase() === 'positive_reply_count') {
        val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
      } else {
        val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
      }
      
      clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
    });
  });
  
  // Calculate the derived fields for each client group from aggregated data
  Object.values(clientGroups).forEach(group => {
    addCalculatedMetrics(group);
  });
  
  return Object.values(clientGroups);
};
