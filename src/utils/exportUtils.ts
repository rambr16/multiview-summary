
import * as XLSX from 'xlsx';
import { DataRow } from './fileTypes';

export const downloadCsv = (data: DataRow[]): void => {
  if (data.length === 0) return;
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  
  XLSX.writeFile(wb, "workbook_summary.csv");
};
