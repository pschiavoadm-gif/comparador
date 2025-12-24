
export interface StockItem {
  id: string | number;
  name: string;
  cdStock: number;
  webStock: number;
  category?: string;
  [key: string]: any;
}

export interface ComparisonResult {
  missingOnWeb: StockItem[];
  totalDiscrepancy: number;
  topPriorityItems: StockItem[];
  summary: string;
}

export interface ColumnMapping {
  id: string;
  name: string;
  cdStock: string;
  webStock: string;
}
