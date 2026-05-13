import type { PredictionResult } from "@/src/lib/prediction";

import { predictionModelOptions, type PredictionModelId } from "@/src/lib/prediction";

interface PredictionPanelProps {
  predictions: PredictionResult[];
  selectedModel: PredictionModelId;
  onSelectedModelChange: (model: PredictionModelId) => void;
  loading?: boolean;
  error?: string | null;
}

export function PredictionPanel({
  predictions,
  selectedModel,
  onSelectedModelChange,
  loading = false,
  error = null,
}: PredictionPanelProps) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Predicciones</p>
          <h3 className="text-xl font-semibold text-slate-900">Valores estimados</h3>
        </div>

        <div className="grid gap-1 sm:text-right">
          <label htmlFor="prediction-model" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Modelo de predicción
          </label>
          <select
            id="prediction-model"
            value={selectedModel}
            onChange={(event) => onSelectedModelChange(event.target.value as PredictionModelId)}
            className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {predictionModelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="max-w-sm text-xs text-slate-500">
            {predictionModelOptions.find((o) => o.id === selectedModel)?.description}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Calculando predicciones...
          </div>
        ) : null}

        {!loading && predictions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No hay predicciones disponibles.
          </div>
        ) : null}

        {!loading && predictions.map((prediction) => (
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
              {prediction.modelo ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modelo</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {predictionModelOptions.find((option) => option.id === prediction.modelo)?.label ?? prediction.modelo}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
