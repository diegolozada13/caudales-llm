import { runExperimentSuite, generateExperimentSummary, type ExperimentConfig } from '@/src/lib/experiments';

export async function POST(request: Request) {
  try {
    const config: ExperimentConfig = await request.json();

    if (!config.models || !config.prompts) {
      return new Response(JSON.stringify({
        error: "Configuración inválida. Se requieren 'models' y 'prompts'."
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log(`Iniciando suite de experimentos con ${config.models.length} modelos y ${config.prompts.length} prompts`);

    const results = await runExperimentSuite(config);
    const summary = generateExperimentSummary(results);

    return new Response(JSON.stringify({
      results,
      summary,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  } catch (error) {
    console.error("Error en experimentos:", error);
    return new Response(JSON.stringify({
      error: "Error al ejecutar experimentos",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}