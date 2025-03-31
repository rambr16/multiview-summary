
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
  
  // Add summary rows based on filtering
  if (clientField) {
    if (selectedClient) {
      // If a specific client is selected, add one summary row for that client
      const clientSummary = createClientSummary(data, clientField, selectedClient);
      dataToExport.push(clientSummary);
    } else if (allData.length > 0) {
      // If "All Clients" is selected, create summaries for each client
      const clients = new Set<string>();
      
      // Get unique client names
      allData.forEach(row => {
        const clientName = String(row[clientField] || '');
        if (clientName && !clientName.includes(' - Summary')) {
          clients.add(clientName);
        }
      });
      
      // Create a summary row for each client
      clients.forEach(clientName => {
        const clientData = allData.filter(row => row[clientField] === clientName);
        if (clientData.length > 0) {
          const clientSummary = createClientSummary(clientData, clientField, clientName);
          dataToExport.push(clientSummary);
        }
      });
    }
  }
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  XLSX.writeFile(wb, "workbook_summary.csv");
};
