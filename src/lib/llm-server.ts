import axios from "axios";
import OpenAI from "openai";

const defaultOllamaUrl = "http://127.0.0.1:11434";
const defaultOllamaModel = process.env.OLLAMA_MODEL || "llama2";
const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const getLLMProvider = (): "ollama" | "openai" => {
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

export const predictWithLLM = async (
  values: { fechaHora: string; valor: number }[],
  umbrales: { bajo: number; medio: number; alto: number },
  horasAdelante: number,
): Promise<number> => {
  const dataText = values.slice(-10).map(p => `${p.fechaHora}: ${p.valor} m³/s`).join(", ");
  const prompt = `Datos históricos de caudal (últimos 10 puntos): ${dataText}. Umbrales: bajo ${umbrales.bajo}, medio ${umbrales.medio}, alto ${umbrales.alto}. Predice el valor del caudal en ${horasAdelante} horas a partir del último punto. Devuelve solo el número estimado en m³/s, sin texto adicional.`;

  const provider = getLLMProvider();

  if (provider === "ollama") {
    const apiUrl = getOllamaUrl();
    const payload = {
      model: process.env.OLLAMA_MODEL || defaultOllamaModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    };

    const response = await axios.post(`${apiUrl}/v1/chat/completions`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const text = response.data.choices?.[0]?.message?.content?.trim();
    const match = text?.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : values[values.length - 1]?.valor ?? 0;
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: openaiModel,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  const match = text?.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : values[values.length - 1]?.valor ?? 0;
};