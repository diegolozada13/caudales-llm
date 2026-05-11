import { predictWithLLM } from "@/src/lib/llm-server";

export async function POST(request: Request) {
  try {
    const { values, umbrales, horasAdelante } = await request.json();

    if (!values || !umbrales || horasAdelante === undefined) {
      return new Response(JSON.stringify({ error: "Faltan parámetros: values, umbrales, horasAdelante" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const prediction = await predictWithLLM(values, umbrales, horasAdelante);

    return new Response(JSON.stringify({ valorEstimado: prediction }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error en predicción LLM:", error);
    return new Response(JSON.stringify({ error: "Error al generar predicción LLM" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}