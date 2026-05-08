"use client";

import { useState } from "react";

const explanations: Record<string, string> = {
  general:
    "El análisis muestra la evolución del caudal en las últimas 24 horas con umbrales claros. El sistema compara el caudal actual con los valores bajo, medio y alto para indicar el estado operativo de la estación.",
  riesgo:
    "El riesgo se basa en la predicción y en el umbral alto de la estación. Si el caudal estimado supera el umbral medio o alto, se considera un riesgo creciente que requiere seguimiento.",
  prediccion:
    "La predicción extrapola la tendencia reciente usando los últimos puntos de datos. Si la línea de caudal sube, la estimación +1h también se incrementa, permitiendo anticipar cambios rápidos.",
};

const buttons = [
  { id: "general", label: "Resumen general" },
  { id: "riesgo", label: "Explicar riesgo" },
  { id: "prediccion", label: "Explicar predicción" },
];

export function LLMExplanation() {
  const [active, setActive] = useState("general");

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Explicación automática</p>
          <h3 className="text-xl font-semibold text-slate-900">LLM mock</h3>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {buttons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => setActive(button.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active === button.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <p className="text-sm leading-7 text-slate-700">{explanations[active]}</p>
    </div>
  );
}
