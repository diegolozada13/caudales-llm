import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getCaudales, getStationVariableById, getVariableValores } from '@/src/lib/api';
import { getPredictedRainfall } from '@/src/lib/weather';
import { analyzeStationRisk, getAIRiskSummary } from '@/src/lib/sentinel-logic';

const defaultOllamaUrl = "http://127.0.0.1:11434/v1";
const defaultOllamaModel = process.env.OLLAMA_MODEL || "llama3.1";
const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const getProviderConfig = () => {
  const llmProvider = process.env.LLM_PROVIDER;
  const modelName = llmProvider === "ollama" ? defaultOllamaModel : openaiModel;
  
  // If it's a Gemini model, use the native Google provider regardless of the LLM_PROVIDER setting
  // (assuming the user might have set LLM_PROVIDER=openai for Gemini OpenAI compatibility)
  if (modelName.startsWith('gemini-')) {
    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return {
      type: 'google' as const,
      model: googleProvider(modelName),
    };
  }

  // Use OpenAI SDK (as a shim for Ollama or for actual OpenAI)
  const openai = createOpenAI({
    baseURL: llmProvider === "ollama"
      ? (process.env.OLLAMA_API_URL ? `${process.env.OLLAMA_API_URL}/v1` : defaultOllamaUrl)
      : (process.env.OPENAI_API_BASE_URL || undefined),
    apiKey: llmProvider === "ollama"
      ? "ollama"
      : (process.env.OPENAI_API_KEY || ""),
  });

  return {
    type: 'openai' as const,
    model: openai(modelName),
  };
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const { model } = getProviderConfig();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    system: "Eres un asistente hidrológico experto. Estás integrado en un dashboard (SAIH) que monitorea caudales de ríos. Utiliza las herramientas disponibles para consultar los datos en tiempo real de las estaciones y dar respuestas claras y precisas al usuario. Responde de manera profesional, directa y en español. Nunca te inventes datos, usa siempre las herramientas.",
    stopWhen: stepCountIs(5),
    tools: {
      get_stations_overview: tool({
        description: 'Obtiene la lista de todas las estaciones de caudal disponibles y sus valores actuales.',
        inputSchema: z.object({}),
        execute: async () => {
          const stations = await getCaudales();
          return stations.map(s => ({
            id: s.idVariable,
            nombre: s.nombreEstacion,
            subcuenca: s.subcuenca,
            poblacion: s.poblacion,
            valorActual: s.valorActual,
            estado: s.valorActual > s.umbrales.alto ? "ALTO" : s.valorActual > s.umbrales.medio ? "MEDIO" : "BAJO"
          }));
        },
      }),
      get_station_details: tool({
        description: 'Obtiene todos los detalles y el historial de 24h de una estación en particular por su ID (ej: "02A01_Q").',
        inputSchema: z.object({
          idVariable: z.string().describe('El ID de la variable/estación, por ejemplo "02A01_Q"'),
        }),
        execute: async ({ idVariable }: { idVariable: string }) => {
          const details = await getStationVariableById(idVariable);
          if (!details) return { error: "Estación no encontrada" };
          return details;
        },
      }),
      get_station_history: tool({
        description: 'Obtiene el historial de caudales de una estación en un rango de fechas.',
        inputSchema: z.object({
          idVariable: z.string().describe('El ID de la variable/estación.'),
          fechaIni: z.string().describe('Fecha de inicio en formato ISO (ej. 2024-05-10T00:00:00Z)'),
          fechaFin: z.string().describe('Fecha de fin en formato ISO (ej. 2024-05-11T00:00:00Z)'),
        }),
        execute: async ({ idVariable, fechaIni, fechaFin }: { idVariable: string; fechaIni: string; fechaFin: string }) => {
          const history = await getVariableValores(idVariable, fechaIni, fechaFin);
          return history;
        },
      }),
      get_station_weather: tool({
        description: 'Obtiene el pronóstico de lluvia para las próximas 24h y evalúa el riesgo de la estación basándose en el caudal actual.',
        inputSchema: z.object({
          stationId: z.string().optional().describe('ID de la estación (ej. "sa-001")'),
          stationName: z.string().optional().describe('Nombre de la estación (ej. "Río Dulce")'),
        }),
        execute: async ({ stationId, stationName }) => {
          const stations = await getCaudales();
          const station = stations.find(s => 
            (stationId && s.idVariable === stationId) || 
            (stationName && s.nombreEstacion.toLowerCase().includes(stationName.toLowerCase()))
          );

          if (!station) return { error: "Estación no encontrada" };

          const predictedRain = await getPredictedRainfall(station.latitud, station.longitud);
          const risk = analyzeStationRisk(station, predictedRain);
          const aiSummary = await getAIRiskSummary(station, predictedRain);

          return {
            station: station.nombreEstacion,
            currentFlow: station.valorActual,
            thresholdAlto: station.umbrales.alto,
            predictedRain24h: `${predictedRain.toFixed(1)} mm`,
            riskLevel: risk,
            aiRiskSummary: aiSummary,
            message: `El riesgo para ${station.nombreEstacion} es ${risk}. ${aiSummary}`
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

