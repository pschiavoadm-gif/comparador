
import * as XLSX from 'xlsx';
import { StockItem, ColumnMapping } from '../types';

/**
 * Extracts the first sequence of numbers found in a string.
 */
const extractFirstNumbers = (value: any): string => {
  if (value === undefined || value === null) return '';
  const strValue = String(value).trim();
  const match = strValue.match(/\d+/);
  return match ? match[0] : '';
};

/**
 * Cleans the product name by removing leading codes.
 */
const cleanProductName = (value: any): string => {
  if (!value) return 'Sin Nombre';
  const str = String(value).trim();
  return str.replace(/^\d+[\s\-\.]+/, '').trim();
};

/**
 * Parses numeric strings from Excel, handling thousands separators (.) and decimal commas (,).
 */
const parseNumericValue = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Common format in these exports: 1.234,56
  const clean = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      resolve(jsonData);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const filterAndSortStock = (data: any[], mapping: ColumnMapping): StockItem[] => {
  // We use a Map to aggregate by SKU ID (extracted numbers)
  const aggregatedMap = new Map<string, StockItem>();

  data.forEach((row, index) => {
    const rawIdValue = String(row[mapping.id] || '').trim();
    const lowerValue = rawIdValue.toLowerCase();
    
    // Filter out rows that are "Totales" or empty
    if (lowerValue.includes('totales') || lowerValue === '') return;
    
    // Must look like a product row (starts with numbers)
    const startsWithNumber = /^\d+/.test(rawIdValue);
    if (!startsWithNumber && !lowerValue.includes('pardo')) return;

    const processedId = extractFirstNumbers(rawIdValue);
    if (!processedId) return;

    const currentCdStock = parseNumericValue(row[mapping.cdStock]);
    const currentWebStock = parseNumericValue(row[mapping.webStock]);
    const currentSalesAmount = parseNumericValue(row[mapping.salesAmount]);

    if (aggregatedMap.has(processedId)) {
      const existing = aggregatedMap.get(processedId)!;
      existing.cdStock += currentCdStock;
      existing.webStock += currentWebStock;
      existing.salesAmount += currentSalesAmount;
    } else {
      let name = row[mapping.name];
      if (mapping.id === mapping.name) {
        name = cleanProductName(rawIdValue);
      }
      
      aggregatedMap.set(processedId, {
        id: processedId,
        name: name || 'Sin Nombre',
        cdStock: currentCdStock,
        webStock: currentWebStock,
        salesAmount: currentSalesAmount
      });
    }
  });

  return Array.from(aggregatedMap.values())
    // Requirement: Stock in CD > 0 and No Stock on Web (aggregated)
    .filter(item => item.cdStock > 0 && item.webStock <= 0)
    // Requirement: Sorted from highest CD stock to lowest
    .sort((a, b) => b.cdStock - a.cdStock);
};

export const exportToExcel = (data: StockItem[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'Código': item.id,
    'Producto': item.name,
    'Ventas (30 días)': item.salesAmount,
    'Stock CD': item.cdStock,
    'Stock Web': item.webStock
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reposicion");
  XLSX.writeFile(workbook, "Stock_Faltante_con_Ventas.xlsx");
};
