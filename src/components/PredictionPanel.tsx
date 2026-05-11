import type { PredictionResult } from "@/src/lib/prediction";

interface PredictionPanelProps {
  predictions: PredictionResult[];
}

export function PredictionPanel({ predictions }: PredictionPanelProps) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Predicciones</p>
        <h3 className="text-xl font-semibold text-slate-900">Valores estimados</h3>
      </div>

      <div className="grid gap-5">
        {predictions.map((prediction) => (
          <div key={prediction.horasAdelante} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">+{prediction.horasAdelante}h</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                {prediction.riesgo}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimado</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{prediction.valorEstimado} m³/s</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tendencia</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 capitalize">{prediction.tendencia}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Riesgo</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 capitalize">{prediction.riesgo}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
