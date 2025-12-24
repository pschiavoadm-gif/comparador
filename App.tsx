
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRightLeft, 
  TrendingUp, 
  AlertCircle, 
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Hash,
  ShieldCheck,
  LayoutList,
  DollarSign
} from 'lucide-react';
import { StockItem, ColumnMapping } from './types';
import { parseExcelFile, filterAndSortStock, exportToExcel } from './utils/excelUtils';
import { getInventoryInsights } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [results, setResults] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    id: '',
    name: '',
    cdStock: '',
    webStock: '',
    salesAmount: ''
  });
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const jsonData = await parseExcelFile(file);
      setData(jsonData);
      if (jsonData.length > 0) {
        const detectedHeaders = Object.keys(jsonData[0]);
        setHeaders(detectedHeaders);
        
        const colE = detectedHeaders[4] || detectedHeaders[0];
        
        setMapping({
          id: colE,
          name: colE,
          cdStock: '',
          webStock: '',
          salesAmount: ''
        });
        setStep('mapping');
      }
    } catch (error) {
      alert("Error al procesar el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const processComparison = () => {
    if (!mapping.cdStock || !mapping.webStock || !mapping.salesAmount) {
      alert("Por favor selecciona las columnas de Stock CD, Stock Web y Ventas.");
      return;
    }
    const filtered = filterAndSortStock(data, mapping);
    setResults(filtered);
    setStep('results');
    generateAIAnalysis(filtered);
  };

  const generateAIAnalysis = async (items: StockItem[]) => {
    if (items.length === 0) return;
    setGeneratingInsights(true);
    const insights = await getInventoryInsights(items);
    setAiInsights(insights);
    setGeneratingInsights(false);
  };

  const reset = () => {
    setData([]);
    setResults([]);
    setStep('upload');
    setAiInsights('');
  };

  const chartData = useMemo(() => {
    return results.slice(0, 10).map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      stock: item.cdStock
    }));
  }, [results]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <LayoutList className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Pardo <span className="text-blue-600">StockSync</span></h1>
          </div>
          {step !== 'upload' && (
            <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-all">
              <RefreshCw className="w-4 h-4" /> Nueva Carga
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-16 text-center transition-all hover:border-blue-400 hover:bg-blue-50/20 group">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="text-blue-600 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4 text-slate-800 tracking-tight">Comparador de Inventario</h2>
              <p className="text-slate-500 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                Detecta productos con stock en <strong>CD</strong> sin presencia <strong>Web</strong> incluyendo monto de ventas.
              </p>
              <label className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl cursor-pointer transition-all shadow-xl shadow-blue-200 active:scale-95">
                <Upload className="w-6 h-6 mr-3" />
                Cargar Archivo Excel
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
              <div className="mt-12 flex justify-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Agrupa por SKU</span>
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Suma Ventas 30d</span>
              </div>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-10">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800">
                <Search className="w-6 h-6 text-blue-600" />
                Configurar Columnas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="col-span-1 md:col-span-2">
                   <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                    <label className="block text-sm font-bold text-blue-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <Hash className="w-4 h-4" /> Columna E (Código / Art)
                    </label>
                    <select 
                      value={mapping.id} 
                      onChange={(e) => setMapping({...mapping, id: e.target.value, name: e.target.value})}
                      className="w-full rounded-xl border-blue-200 bg-white focus:ring-blue-500 font-medium p-3"
                    >
                      <option value="">Seleccionar columna...</option>
                      {headers.map((h, i) => <option key={h} value={h}>{`Col ${String.fromCharCode(65 + i)}: ${h}`}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Stock CD
                  </label>
                  <select 
                    value={mapping.cdStock} 
                    onChange={(e) => setMapping({...mapping, cdStock: e.target.value})}
                    className="w-full rounded-xl border-slate-200 bg-white focus:ring-blue-500 p-3"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map((h, i) => <option key={h} value={h}>{`Col ${String.fromCharCode(65 + i)}: ${h}`}</option>)}
                  </select>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Stock Web
                  </label>
                  <select 
                    value={mapping.webStock} 
                    onChange={(e) => setMapping({...mapping, webStock: e.target.value})}
                    className="w-full rounded-xl border-slate-200 bg-white focus:ring-indigo-500 p-3"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map((h, i) => <option key={h} value={h}>{`Col ${String.fromCharCode(65 + i)}: ${h}`}</option>)}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 p-5 bg-green-50 rounded-2xl border border-green-200">
                  <label className="block text-sm font-bold text-green-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" /> Ventas últimos 30 días (Monto)
                  </label>
                  <select 
                    value={mapping.salesAmount} 
                    onChange={(e) => setMapping({...mapping, salesAmount: e.target.value})}
                    className="w-full rounded-xl border-green-200 bg-white focus:ring-green-500 font-medium p-3"
                  >
                    <option value="">Seleccionar columna de ventas...</option>
                    {headers.map((h, i) => <option key={h} value={h}>{`Col ${String.fromCharCode(65 + i)}: ${h}`}</option>)}
                  </select>
                  <p className="mt-2 text-xs text-green-700 italic">Este valor se sumará por cada SKU idéntico.</p>
                </div>
              </div>

              <button 
                onClick={processComparison}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 text-lg"
              >
                Procesar Comparación
                <ArrowRightLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Artículos Detectados</p>
                <p className="text-4xl font-black text-slate-900">{results.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ventas Perdidas (30d)</p>
                <p className="text-4xl font-black text-green-600">
                  ${results.reduce((acc, curr) => acc + curr.salesAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Stock en CD Total</p>
                <p className="text-4xl font-black text-blue-600">
                  {results.reduce((acc, curr) => acc + curr.cdStock, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                      <LayoutList className="w-5 h-5 text-blue-600" />
                      Planilla de Oportunidades
                    </h3>
                    <button 
                      onClick={() => exportToExcel(results)}
                      className="text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> EXPORTAR EXCEL
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cod SKU</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ventas 30d</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">En CD</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Web</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.length > 0 ? (
                          results.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-8 py-5 text-sm font-mono font-bold text-blue-700">{item.id}</td>
                              <td className="px-8 py-5 text-sm font-bold text-slate-700">{item.name}</td>
                              <td className="px-8 py-5 text-sm text-right font-black text-green-700">${item.salesAmount.toLocaleString()}</td>
                              <td className="px-8 py-5 text-sm text-right font-black text-slate-900">{item.cdStock.toLocaleString()}</td>
                              <td className="px-8 py-5 text-sm text-right">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-tighter">Faltante</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                              <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-10" />
                              No se detectaron faltantes web con stock en CD.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Top Stock CD
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                        />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="stock" radius={[0, 8, 8, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#3b82f6'} fillOpacity={1 - index * 0.08} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white">
                  <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-4 h-4" /> Inteligencia de Inventario
                  </h3>
                  {generatingInsights ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Analizando Tendencias...</p>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-slate-300 max-h-96 overflow-y-auto custom-scrollbar pr-2 prose prose-invert prose-sm">
                      {aiInsights || "Sube y mapea el archivo para ver el análisis de stock."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8" />
            <h3 className="text-xl font-black text-slate-800 mb-2">Leyendo Archivo</h3>
            <p className="text-slate-500">Analizando registros y preparando la comparación...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
