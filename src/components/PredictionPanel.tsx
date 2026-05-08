import type { PredictionResult } from "@/src/lib/prediction";

interface PredictionPanelProps {
  prediction: PredictionResult;
}

export function PredictionPanel({ prediction }: PredictionPanelProps) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Predicción</p>
          <h3 className="text-xl font-semibold text-slate-900">Valor estimado +1h</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{prediction.riesgo.toUpperCase()}</div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimado</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{prediction.valorEstimado} m³/s</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tendencia</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 capitalize">{prediction.tendencia}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Riesgo</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 capitalize">{prediction.riesgo}</p>
        </div>
      </div>
    </div>
  );
}
