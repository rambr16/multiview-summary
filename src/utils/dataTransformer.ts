import * as XLSX from 'xlsx';
import { DataRow } from './fileTypes';

export const extractSheetData = (workbook: XLSX.WorkBook, selectedSheets: string[]): DataRow[] => {
  const allData: DataRow[] = [];
  
  for (const sheetName of selectedSheets) {
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.warn(`Sheet "${sheetName}" not found in workbook`);
      continue;
    }
    
    const sheetData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
    
    const validRows = sheetData.filter(row => {
      // Skip rows where the client_name or any column containing "client" ends with " - Summary"
      const clientField = Object.keys(row).find(key => key.toLowerCase().includes('client'));
      if (clientField && typeof row[clientField] === 'string') {
        const clientValue = row[clientField] as string;
        if (clientValue.endsWith(' - Summary')) {
          return false;
        }
      }
      
      // Keep rows that have at least one non-empty value
      return Object.values(row).some(val => val !== '');
    });
    
    if (validRows.length > 0) {
      console.log(`Processed ${validRows.length} rows from sheet "${sheetName}"`);
      allData.push(...validRows);
    } else {
      console.warn(`No valid data found in sheet "${sheetName}"`);
    }
  }
  
  console.log(`Total rows processed from all sheets: ${allData.length}`);
  
  const processedData = processRowData(allData);
  
  // Filter to only include rows where unique_sent_count >= 1
  return processedData.filter(row => {
    const uniqueSentCount = row['unique_sent_count'] as number;
    return typeof uniqueSentCount === 'number' && uniqueSentCount >= 1;
  });
};

const processRowData = (data: DataRow[]): DataRow[] => {
  return data.map(row => {
    const processedRow: DataRow = {};
    
    const numericFields = [
      'sent_count', 'unique_sent_count', 'positive_reply_count', 
      'reply_count', 'bounce_count', 'open_count', 'unique_open_count',
      'click_count'
    ];
    
    Object.keys(row).forEach(key => {
      // Skip columns we want to exclude
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'record_count' || 
          lowerKey === 'id' || 
          lowerKey === 'user_id' || 
          lowerKey === 'ln_connection_req_pending_count' ||
          lowerKey === 'ln_connection_req_accepted_count' ||
          lowerKey === 'ln_connection_req_skipped_sent_msg_count') {
        return;
      }
      
      if (numericFields.includes(lowerKey) && typeof row[key] === 'string') {
        const numValue = parseFloat(row[key] as string);
        processedRow[key] = isNaN(numValue) ? 0 : numValue;
      } else {
        processedRow[key] = row[key];
      }
    });
    
    // Add calculated metrics
    addCalculatedMetrics(processedRow);
    
    return processedRow;
  });
};

export const addCalculatedMetrics = (row: DataRow): void => {
  const uniqueSentCount = row['unique_sent_count'] as number || 0;
  const positiveReplyCount = row['positive_reply_count'] as number || 0;
  const replyCount = row['reply_count'] as number || 0;
  const bounceCount = row['bounce_count'] as number || 0;
  
  // PRR vs RR - Positive Reply Count / Reply Count (percentage)
  if (replyCount > 0) {
    row['prr_vs_rr'] = (positiveReplyCount / replyCount) * 100;
  } else {
    row['prr_vs_rr'] = 0;
  }
  
  // RR - Reply Count / Unique Sent Count (percentage)
  if (uniqueSentCount > 0) {
    row['rr'] = (replyCount / uniqueSentCount) * 100;
  } else {
    row['rr'] = 0;
  }
  
  // Bounce - Bounce Count / Unique Sent Count (percentage)
  if (uniqueSentCount > 0) {
    row['bounce_rate'] = (bounceCount / uniqueSentCount) * 100;
  } else {
    row['bounce_rate'] = 0;
  }
  
  // Unique leads / Positive - Unique Sent Count / Positive Reply Count
  if (positiveReplyCount > 0) {
    row['unique_leads_per_positive'] = uniqueSentCount / positiveReplyCount;
  } else {
    row['unique_leads_per_positive'] = 'no positive reply';
  }
};
