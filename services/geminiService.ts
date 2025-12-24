
import { GoogleGenAI } from "@google/genai";
import { StockItem } from "../types";

export const getInventoryInsights = async (missingItems: StockItem[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const sampleData = missingItems.slice(0, 10).map(item => ({
    nombre: item.name,
    stockCD: item.cdStock
  }));

  const prompt = `
    Analiza la siguiente lista de productos que tienen stock en el Centro de Distribución (CD) pero NO están publicados o no tienen stock en la web.
    Hay un total de ${missingItems.length} productos en esta situación.
    
    Aquí están los 10 principales por volumen de stock:
    ${JSON.stringify(sampleData, null, 2)}
    
    Por favor, proporciona un resumen ejecutivo breve (máximo 3 párrafos) en español indicando:
    1. El impacto potencial de no tener estos productos online.
    2. Una recomendación estratégica sobre cómo priorizar la carga de estos productos.
    3. Un tono profesional y motivador para el equipo de e-commerce.
    
    Usa formato Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se pudieron generar insights en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con la inteligencia artificial para el análisis.";
  }
};
