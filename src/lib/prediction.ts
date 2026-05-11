import type { HistoryPoint, Umbrales } from "@/src/lib/mock-data";

export interface PredictionResult {
  valorEstimado: number;
  tendencia: "sube" | "está estable" | "baja";
  riesgo: "bajo" | "medio" | "alto";
  fechaPrediccion: string;
  horasAdelante: number;
}

const getLastPoints = (values: HistoryPoint[], count = 4): HistoryPoint[] =>
  values.slice(-count);

export const linearPrediction = (
  values: HistoryPoint[],
  umbrales: Umbrales,
  horasAdelante = 1,
): PredictionResult => {
  const lastPoints = getLastPoints(values, 4);
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

export const buildPredictionChartPoint = (
  values: HistoryPoint[],
  horasAdelante = 1,
): HistoryPoint | undefined => {
  const ultimo = values[values.length - 1];
  if (!ultimo) return undefined;
  const predictedDate = new Date(new Date(ultimo.fechaHora).getTime() + horasAdelante * 60 * 60 * 1000);
  const previousValor = values[values.length - 2]?.valor;
  const delta = previousValor !== undefined ? ultimo.valor - previousValor : 0;
  return {
    fechaHora: predictedDate.toISOString(),
    valor: Number((ultimo.valor + delta).toFixed(1)),
  };
};
