
import * as XLSX from 'xlsx';
import { DataRow } from './fileTypes';

// Helper function to create client summaries
const createClientSummary = (data: DataRow[], clientField: string | null, clientName: string): DataRow => {
  const summary: DataRow = {};
  
  // Find the client field if not provided
  if (!clientField) {
    clientField = Object.keys(data[0] || {}).find(key => 
      key.toLowerCase().includes('client')
    ) || '';
  }
  
  // Set the client name with summary suffix
  if (clientField) {
    summary[clientField] = `${clientName} - Summary`;
  }
  
  // Get all numeric columns except calculated fields
  const columns = Object.keys(data[0] || {});
  const numericColumns = columns.filter(col => 
    !['total_count', 'drafted_count', 'record_count', 'id', 'user_id'].includes(col.toLowerCase()) &&
    !['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col) &&
    (typeof data[0][col] === 'number' || !isNaN(Number(data[0][col])))
  );
  
  // Sum numeric values for this client
  numericColumns.forEach(col => {
    const sum = data.reduce((acc, row) => {
      const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
      return acc + (val as number);
    }, 0);
    
    summary[col] = sum;
  });
  
  // Add calculated metrics
  if (summary['unique_sent_count'] && (summary['unique_sent_count'] as number) > 0) {
    const uniqueSentCount = summary['unique_sent_count'] as number;
    const replyCount = summary['reply_count'] as number || 0;
    const positiveReplyCount = summary['positive_reply_count'] as number || 0;
    const bounceCount = summary['bounce_count'] as number || 0;
    
    // PRR vs RR - Positive Reply Count / Reply Count (percentage)
    if (replyCount > 0) {
      summary['prr_vs_rr'] = (positiveReplyCount / replyCount) * 100;
    } else {
      summary['prr_vs_rr'] = 0;
    }
    
    // RR - Reply Count / Unique Sent Count (percentage)
    summary['rr'] = (replyCount / uniqueSentCount) * 100;
    
    // Bounce Rate - Bounce Count / Unique Sent Count (percentage)
    summary['bounce_rate'] = (bounceCount / uniqueSentCount) * 100;
    
    // Unique Leads per Positive
    if (positiveReplyCount > 0) {
      summary['unique_leads_per_positive'] = uniqueSentCount / positiveReplyCount;
    } else {
      summary['unique_leads_per_positive'] = 'no positive reply';
    }
  }
  
  return summary;
};

export const downloadCsv = (data: DataRow[], selectedClient: string | null = null, allData: DataRow[] = []): void => {
  if (data.length === 0) return;
  
  let dataToExport = [...data];
  
  // Find the client field
  const clientField = Object.keys(data[0] || {}).find(key => 
    key.toLowerCase().includes('client')
  );

  // Filter rows where Unique Sent Count > 1 and exclude summary rows
  dataToExport = dataToExport.filter(row => {
    const uniqueSentCount = Number(row['unique_sent_count']) || 0;
    const isNotSummary = !String(row[clientField || '']).includes(' - Summary');
    return uniqueSentCount > 1 && isNotSummary;
  });

  // Sort alphabetically by client name
  if (clientField) {
    dataToExport.sort((a, b) => {
      const clientA = String(a[clientField] || '').toLowerCase();
      const clientB = String(b[clientField] || '').toLowerCase();
      return clientA.localeCompare(clientB);
    });
  }

  // Check if AM data is present by looking for AM column
  const hasAmData = dataToExport.some(row => 'AM' in row);

  // If no AM data, remove AM-related columns
  if (!hasAmData) {
    dataToExport = dataToExport.map(row => {
      const newRow = { ...row };
      ['AM', 'Target', 'Target %', 'Weekend sendout'].forEach(key => {
        delete newRow[key];
      });
      return newRow;
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  XLSX.writeFile(wb, "workbook_summary.csv");
};

