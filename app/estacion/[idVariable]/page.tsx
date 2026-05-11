"use client";

import { useEffect, useState, use } from "react";
import { StationChart } from "@/src/components/StationChart";
import { PredictionPanel } from "@/src/components/PredictionPanel";
import { LLMExplanation } from "@/src/components/LLMExplanation";
import { getStationVariableById, getVariableValores } from "@/src/lib/api";
import { calculateEstado, formatDateTime, formatNumber, estadoColor } from "@/src/lib/utils";
import { linearPrediction } from "@/src/lib/prediction";
import type { StationVariable, HistoryPoint } from "@/src/lib/mock-data";

interface PageProps {
  params: Promise<{ idVariable: string }>;
}

export default function StationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [station, setStation] = useState<StationVariable | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const now = new Date();
  const defaultEnd = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const [selectedStart, setSelectedStart] = useState(defaultStart);
  const [selectedEnd, setSelectedEnd] = useState(defaultEnd);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxRangeMs = 48 * 60 * 60 * 1000;

  const buildDateRange = (startDateTime: string, endDateTime: string) => {
    const start = new Date(`${startDateTime}:00`);
    const end = new Date(`${endDateTime}:00`);
    return {
      fechaIni: start.toISOString(),
      fechaFin: end.toISOString(),
    };
  };

  const rangeStart = new Date(`${selectedStart}:00`);
  const rangeEnd = new Date(`${selectedEnd}:00`);
  const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();
  const isRangeValid = rangeDuration > 0 && rangeDuration <= maxRangeMs;

  const loadHistory = async (idVariable: string, startDateTime: string, endDateTime: string) => {
    try {
      setHistoryLoading(true);
      const { fechaIni, fechaFin } = buildDateRange(startDateTime, endDateTime);
      const values = await getVariableValores(idVariable, fechaIni, fechaFin);
      setHistory(values);
    } catch (err) {
      console.error("Error loading history:", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const loadStation = async () => {
      try {
        setLoading(true);
        const data = await getStationVariableById(resolvedParams.idVariable);
        if (!data) {
          setError("Estación no encontrada");
          setStation(null);
          setHistory([]);
        } else {
          setStation(data);
          setHistory(data.valores24h);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading station:", err);
        setError("Error al cargar los datos de la estación");
        setStation(null);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadStation();
  }, [resolvedParams.idVariable]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-40 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm animate-pulse" />
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="h-96 rounded-4xl border border-slate-200 bg-white shadow-sm animate-pulse" />
            <div className="space-y-6">
              <div className="h-40 rounded-4xl border border-slate-200 bg-white shadow-sm animate-pulse" />
              <div className="h-40 rounded-4xl border border-slate-200 bg-white shadow-sm animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !station) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-4xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Error</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{error}</h1>
          <p className="mt-3 text-slate-600">Vuelve a la página principal y selecciona otra estación.</p>
        </div>
      </main>
    );
  }

  const estado = calculateEstado(station.valorActual, station.umbrales);
  const dataToUse = history.length > 0 ? history : station.valores24h;
  const prediction = linearPrediction(dataToUse, station.umbrales);
  const predictionPoint = {
    fechaHora: prediction.fechaPrediccion,
    valor: prediction.valorEstimado,
  };

  const handleLoadSelectedRange = async () => {
    await loadHistory(resolvedParams.idVariable, selectedStart, selectedEnd);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Detalle de estación</p>
              <h1 className="text-3xl font-semibold text-slate-900">{station.nombreEstacion}</h1>
              <p className="text-sm text-slate-600">{station.nombreVariable}</p>
            </div>
            <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${estadoColor(estado)}`}>
              Estado: {estado}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subcuenca</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{station.subcuenca}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Provincia / población</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{station.provincia} / {station.poblacion}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Valor actual</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(station.valorActual)}</p>
              <p className="mt-2 text-sm text-slate-600">{formatDateTime(station.fechaHora)}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Visualización de hasta 48 horas</p>
              <p className="text-sm text-slate-600">Selecciona fecha y hora de inicio y fin. El rango máximo es de 48 horas.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <div className="grid gap-1">
                <label htmlFor="selected-start" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Inicio
                </label>
                <input
                  id="selected-start"
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(event) => setSelectedStart(event.target.value)}
                  className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="selected-end" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Fin
                </label>
                <input
                  id="selected-end"
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(event) => setSelectedEnd(event.target.value)}
                  className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleLoadSelectedRange}
                  disabled={historyLoading || !isRangeValid}
                  className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {historyLoading ? "Cargando..." : "Cargar rango"}
                </button>
              </div>
            </div>
          </div>
          {!isRangeValid ? (
            <p className="mt-3 text-sm text-amber-700">El rango debe ser mayor a 0 y no exceder 48 horas.</p>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <StationChart series={dataToUse} thresholds={station.umbrales} predictionPoint={predictionPoint} />

          <div className="space-y-6">
            <PredictionPanel prediction={prediction} />
            <LLMExplanation />
          </div>
        </section>
      </div>
    </main>
  );
}
