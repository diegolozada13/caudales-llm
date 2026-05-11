"use client";

import { useEffect, useState } from "react";
import type { StationVariable } from "@/src/lib/mock-data";
import type { PredictionResult } from "@/src/lib/prediction";

interface LLMExplanationProps {
  station: StationVariable;
  predictions: PredictionResult[];
}

const buttons = [
  { id: "general", label: "Resumen general" },
  { id: "riesgo", label: "Explicar riesgo" },
  { id: "prediccion", label: "Explicar predicción" },
];

const initialMessage =
  "Pulsa uno de los botones para obtener una explicación generada por el modelo LLM.";

export function LLMExplanation({ station, predictions }: LLMExplanationProps) {
  const [active, setActive] = useState("general");
  const [content, setContent] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const response = await fetch("/api/llm/provider");
        if (!response.ok) return;
        const data = await response.json();
        setProvider(data.provider);
      } catch {
        setProvider(null);
      }
    };

    loadProvider();
  }, []);

  const fetchExplanation = async (mode: string) => {
    setActive(mode);
    setLoading(true);
    setError(null);
    setContent(initialMessage);

    try {
      const response = await fetch("/api/llm/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode, station, predictions }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Error al generar la explicación LLM");
      }

      setContent(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Explicación automática</p>
          <h3 className="text-xl font-semibold text-slate-900">LLM</h3>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.24em] text-slate-500">
          Modelo activo: <span className="font-semibold text-slate-900">{provider ?? "cargando..."}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {buttons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => fetchExplanation(button.id)}
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

      <div className="min-h-[10rem] rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        {loading ? "Generando respuesta..." : error ? error : content}
      </div>
    </div>
  );
}
