import axios from "axios";
import OpenAI from "openai";
import type { StationVariable } from "@/src/lib/mock-data";
import type { PredictionResult } from "@/src/lib/prediction";

const defaultOllamaUrl = "http://127.0.0.1:11434";
const defaultOllamaModel = process.env.OLLAMA_MODEL || "llama2";
const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const buildPrompt = (
  mode: "general" | "riesgo" | "prediccion",
  station: StationVariable,
  predictions: PredictionResult[],
) => {
  const predictionText = predictions
    .map(
      (prediction) =>
        `+${prediction.horasAdelante}h: ${prediction.valorEstimado} m³/s, tendencia ${prediction.tendencia}, riesgo ${prediction.riesgo}`,
    )
    .join(". ");

  const base = `Estación: ${station.nombreEstacion}. Variable: ${station.nombreVariable}. Valor actual: ${station.valorActual} m³/s. Fecha/hora: ${station.fechaHora}. Umbrales: bajo ${station.umbrales.bajo}, medio ${station.umbrales.medio}, alto ${station.umbrales.alto}. Predicciones: ${predictionText}.`;

  if (mode === "general") {
    return `${base} Explica brevemente el estado general y la evolución reciente del caudal. Usa un tono claro y directo en español.`;
  }

  if (mode === "riesgo") {
    return `${base} Explica el riesgo actual del caudal respecto a los umbrales, y qué debería vigilar el operador. Mantén la respuesta en español y en un párrafo corto.`;
  }

  return `${base} Explica la predicción +1h en detalle: qué significa para la tendencia y si el caudal va a subir, bajar o mantenerse. Responde en español de forma clara.`;
};

export const getLLMProvider = (): "ollama" | "openai" => {
  if (process.env.LLM_PROVIDER === "ollama") {
    return "ollama";
  }
  if (process.env.LLM_PROVIDER === "openai") {
    return "openai";
  }
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "ollama";
};

const getOllamaUrl = (): string => process.env.OLLAMA_API_URL || defaultOllamaUrl;

export const explainWithLLM = async (
  mode: "general" | "riesgo" | "prediccion",
  station: StationVariable,
  predictions: PredictionResult[],
): Promise<string> => {
  const prompt = buildPrompt(mode, station, predictions);
  const provider = getLLMProvider();

  if (provider === "ollama") {
    const apiUrl = getOllamaUrl();
    const payload = {
      model: process.env.OLLAMA_MODEL || defaultOllamaModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    };

    const response = await axios.post(`${apiUrl}/v1/chat/completions`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data.choices?.[0]?.message?.content?.trim() ?? "No se obtuvo respuesta del modelo.";
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: openaiModel,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return completion.choices?.[0]?.message?.content?.trim() ?? "No se obtuvo respuesta del modelo.";
};

