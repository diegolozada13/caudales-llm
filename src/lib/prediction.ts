import type { HistoryPoint, Umbrales } from "@/src/lib/mock-data";

export interface PredictionResult {
  valorEstimado: number;
  tendencia: "sube" | "está estable" | "baja";
  riesgo: "bajo" | "medio" | "alto";
  fechaPrediccion: string;
  horasAdelante: number;
  modelo?: string; // Nuevo: identificar el modelo usado
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
