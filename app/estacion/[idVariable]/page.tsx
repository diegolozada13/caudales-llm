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
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildDateRange = (date: string) => {
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { fechaIni: start.toISOString(), fechaFin: end.toISOString() };
  };

  const loadHistory = async (idVariable: string, date: string) => {
    try {
      setHistoryLoading(true);
      const { fechaIni, fechaFin } = buildDateRange(date);
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

  const handleLoadSelectedDay = async () => {
    await loadHistory(resolvedParams.idVariable, selectedDate);
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
          <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Mostrar 24h de día concreto</p>
              <p className="text-sm text-slate-600">Por defecto se muestran las últimas 24 horas.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor="selected-day" className="sr-only">
                Seleccionar día
              </label>
              <input
                id="selected-day"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={handleLoadSelectedDay}
                disabled={historyLoading}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {historyLoading ? "Cargando..." : "Cargar día"}
              </button>
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
