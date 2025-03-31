
import * as XLSX from 'xlsx';

export interface DataRow {
  [key: string]: string | number;
}

export const processWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    return workbook;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process the file. Please check the file format.');
  }
};

export const extractSheetData = (workbook: XLSX.WorkBook, selectedSheets: string[]): DataRow[] => {
  const allData: DataRow[] = [];
  
  for (const sheetName of selectedSheets) {
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
    
    const validRows = sheetData.filter(row => {
      return Object.values(row).some(val => val !== '');
    });
    
    allData.push(...validRows);
  }
  
  const processedData = allData.map(row => {
    const processedRow: DataRow = {};
    
    const numericFields = [
      'sent_count', 'unique_sent_count', 'positive_reply_count', 
      'reply_count', 'bounce_count'
    ];
    
    Object.keys(row).forEach(key => {
      if (numericFields.includes(key) && typeof row[key] === 'string') {
        const numValue = parseFloat(row[key] as string);
        processedRow[key] = isNaN(numValue) ? 0 : numValue;
      } else {
        processedRow[key] = row[key];
      }
    });
    
    return processedRow;
  });
  
  return processedData;
};

export const generateSummaryView = (filteredData: DataRow[]): DataRow[] => {
  if (!filteredData.length) return [];

  const columns = Object.keys(filteredData[0]);
  const numericColumns = columns.filter(col => 
    !['total_count', 'drafted_count'].includes(col) &&
    (typeof filteredData[0][col] === 'number' || 
     !isNaN(Number(filteredData[0][col])))
  );

  const clientField = columns.find(col => col.toLowerCase().includes('client')) || null;
  
  if (!clientField) {
    const summary: DataRow = { total_records: filteredData.length };
    numericColumns.forEach(col => {
      const sum = filteredData.reduce((acc, row) => {
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        return acc + (val as number);
      }, 0);
      summary[col] = sum;
    });
    return [summary];
  } else {
    const clientGroups: { [key: string]: DataRow } = {};
    
    filteredData.forEach(row => {
      const client = String(row[clientField] || 'Unknown');
      if (!clientGroups[client]) {
        clientGroups[client] = { 
          [clientField]: client,
          record_count: 0 
        };
        
        numericColumns.forEach(col => {
          clientGroups[client][col] = 0;
        });
      }
      
      clientGroups[client].record_count = (clientGroups[client].record_count as number) + 1;
      
      numericColumns.forEach(col => {
        if (col === 'record_count') return;
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
      });
    });
    
    return Object.values(clientGroups);
  }
};

export const downloadCsv = (data: DataRow[]): void => {
  if (data.length === 0) return;
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  
  XLSX.writeFile(wb, "workbook_summary.csv");
};
