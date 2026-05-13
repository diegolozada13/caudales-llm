import type { HistoryPoint, Umbrales } from "@/src/lib/mock-data";

export type PredictionModelId = "lineal" | "promedio-movil" | "reglas-simples" | "llm";

export const predictionModelOptions: { id: PredictionModelId; label: string; description: string }[] = [
  { id: "lineal", label: "Lineal", description: "Determinista y rápido." },
  { id: "promedio-movil", label: "Promedio móvil", description: "Suaviza cambios recientes usando deltas promedio." },
  { id: "reglas-simples", label: "Reglas simples", description: "Heurístico basado en los últimos cambios." },
  { id: "llm", label: "LLM (experimental)", description: "Predicción con modelo de lenguaje (más lento/variable)." },
];

export interface PredictionResult {
  valorEstimado: number;
  tendencia: "sube" | "está estable" | "baja";
  riesgo: "bajo" | "medio" | "alto";
  fechaPrediccion: string;
  horasAdelante: number;
  modelo?: PredictionModelId;
}

const getLastPoints = (values: HistoryPoint[], count = 4): HistoryPoint[] =>
  values.slice(-count);

export const linearPrediction = (
  values: HistoryPoint[],
  umbrales: Umbrales,
  horasAdelante = 1,
): PredictionResult => {
  // Usar más datos históricos para predicciones más lejanas
  const count = horasAdelante <= 4 ? 4 : horasAdelante <= 24 ? 8 : 12;
  const lastPoints = getLastPoints(values, count);
  const [prev, ...rest] = lastPoints;
  const ultimo = lastPoints[lastPoints.length - 1];

  if (!prev || !ultimo) {
    return {
      valorEstimado: values[values.length - 1]?.valor ?? 0,
      tendencia: "está estable",
      riesgo: "bajo",
      fechaPrediccion: new Date().toISOString(),
      horasAdelante,
      modelo: "lineal",
    };
  }

  const deltas = lastPoints.reduce<number[]>((acc, point, index, list) => {
    if (index === 0) return acc;
    const previous = list[index - 1];
    acc.push(point.valor - previous.valor);
    return acc;
  }, []);

  const slope = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  const valorEstimado = Number((ultimo.valor + slope * horasAdelante).toFixed(1));

  const tendencia = Math.abs(slope) < 0.2 ? "está estable" : slope > 0 ? "sube" : "baja";

  const riesgo = valorEstimado > umbrales.alto ? "alto" : valorEstimado > umbrales.medio ? "medio" : "bajo";

  const fechaPrediccion = new Date(new Date(ultimo.fechaHora).getTime() + horasAdelante * 60 * 60 * 1000).toISOString();

  return {
    valorEstimado,
    tendencia,
    riesgo,
    fechaPrediccion,
    horasAdelante,
    modelo: "lineal",
  };
};

export const movingAveragePrediction = (
  values: HistoryPoint[],
  umbrales: Umbrales,
  horasAdelante = 1,
): PredictionResult => {
  const count = horasAdelante <= 4 ? 4 : horasAdelante <= 24 ? 8 : 12;
  const lastPoints = getLastPoints(values, count);
  const ultimo = lastPoints[lastPoints.length - 1];

  if (!ultimo) {
    return {
      valorEstimado: values[values.length - 1]?.valor ?? 0,
      tendencia: "está estable",
      riesgo: "bajo",
      fechaPrediccion: new Date().toISOString(),
      horasAdelante,
      modelo: "promedio-movil",
    };
  }

  // Promedio móvil: usar el promedio de deltas como slope
  const deltas = lastPoints.reduce<number[]>((acc, point, index, list) => {
    if (index === 0) return acc;
    const previous = list[index - 1];
    acc.push(point.valor - previous.valor);
    return acc;
  }, []);

  const avgDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  const valorEstimado = Number((ultimo.valor + avgDelta * horasAdelante).toFixed(1));

  const tendencia = Math.abs(avgDelta) < 0.2 ? "está estable" : avgDelta > 0 ? "sube" : "baja";

  const riesgo = valorEstimado > umbrales.alto ? "alto" : valorEstimado > umbrales.medio ? "medio" : "bajo";

  const fechaPrediccion = new Date(new Date(ultimo.fechaHora).getTime() + horasAdelante * 60 * 60 * 1000).toISOString();

  return {
    valorEstimado,
    tendencia,
    riesgo,
    fechaPrediccion,
    horasAdelante,
    modelo: "promedio-movil",
  };
};

export const ruleBasedPrediction = (
  values: HistoryPoint[],
  umbrales: Umbrales,
  horasAdelante = 1,
): PredictionResult => {
  const count = horasAdelante <= 4 ? 4 : horasAdelante <= 24 ? 8 : 12;
  const lastPoints = getLastPoints(values, count);
  const ultimo = lastPoints[lastPoints.length - 1];

  if (!ultimo) {
    return {
      valorEstimado: values[values.length - 1]?.valor ?? 0,
      tendencia: "está estable",
      riesgo: "bajo",
      fechaPrediccion: new Date().toISOString(),
      horasAdelante,
      modelo: "reglas-simples",
    };
  }

  // Reglas simples: si los últimos 2 deltas son positivos, continuar subiendo, etc.
  const deltas = lastPoints.reduce<number[]>((acc, point, index, list) => {
    if (index === 0) return acc;
    const previous = list[index - 1];
    acc.push(point.valor - previous.valor);
    return acc;
  }, []);

  const recentDeltas = deltas.slice(-2); // Últimos 2 deltas
  const positiveCount = recentDeltas.filter(d => d > 0).length;
  const negativeCount = recentDeltas.filter(d => d < 0).length;

  let slope = 0;
  if (positiveCount > negativeCount) {
    slope = Math.max(...recentDeltas.filter(d => d > 0)) || 0.5; // Sube
  } else if (negativeCount > positiveCount) {
    slope = Math.min(...recentDeltas.filter(d => d < 0)) || -0.5; // Baja
  } // Si igual, slope = 0

  const valorEstimado = Number((ultimo.valor + slope * horasAdelante).toFixed(1));

  const tendencia = slope > 0.2 ? "sube" : slope < -0.2 ? "baja" : "está estable";

  const riesgo = valorEstimado > umbrales.alto ? "alto" : valorEstimado > umbrales.medio ? "medio" : "bajo";

  const fechaPrediccion = new Date(new Date(ultimo.fechaHora).getTime() + horasAdelante * 60 * 60 * 1000).toISOString();

  return {
    valorEstimado,
    tendencia,
    riesgo,
    fechaPrediccion,
    horasAdelante,
    modelo: "reglas-simples",
  };
};

export const llmPrediction = async (
  values: HistoryPoint[],
  umbrales: Umbrales,
  horasAdelante = 1,
): Promise<PredictionResult> => {
  const ultimo = values[values.length - 1];

  if (!ultimo) {
    return {
      valorEstimado: values[values.length - 1]?.valor ?? 0,
      tendencia: "está estable",
      riesgo: "bajo",
      fechaPrediccion: new Date().toISOString(),
      horasAdelante,
      modelo: "llm",
    };
  }

  try {
    const response = await fetch("/api/llm/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values, umbrales, horasAdelante }),
    });

    if (!response.ok) {
      throw new Error("Error en API de predicción LLM");
    }

    const data = await response.json();
    const valorEstimado = data.valorEstimado;

    // Calcular tendencia comparando con el último valor
    const tendencia = valorEstimado > ultimo.valor + 0.5 ? "sube" : valorEstimado < ultimo.valor - 0.5 ? "baja" : "está estable";

    const riesgo = valorEstimado > umbrales.alto ? "alto" : valorEstimado > umbrales.medio ? "medio" : "bajo";

    const fechaPrediccion = new Date(new Date(ultimo.fechaHora).getTime() + horasAdelante * 60 * 60 * 1000).toISOString();

    return {
      valorEstimado: Number(valorEstimado.toFixed(1)),
      tendencia,
      riesgo,
      fechaPrediccion,
      horasAdelante,
      modelo: "llm",
    };
  } catch (error) {
    // Fallback a lineal si falla LLM
    return linearPrediction(values, umbrales, horasAdelante);
  }
};
