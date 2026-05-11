import { explainWithLLM } from "@/src/lib/llm";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mode, station, predictions } = body;

  if (!mode || !station || !Array.isArray(predictions)) {
    return new Response(JSON.stringify({ error: "Faltan parámetros: mode, station o predictions" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const text = await explainWithLLM(mode, station, predictions);
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("LLM explain error:", error);
    return new Response(JSON.stringify({ error: "Error al generar la explicación LLM" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
