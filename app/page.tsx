"use client";

import { useMemo, useState, useEffect } from "react";
import { StationCard } from "@/src/components/StationCard";
import { AlertsPanel } from "@/src/components/AlertsPanel";
import { normalizeSearch } from "@/src/lib/utils";
import type { StationVariable } from "@/src/lib/mock-data";
import { getCaudales } from "@/src/lib/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [stations, setStations] = useState<StationVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        const data = await getCaudales();
        setStations(data);
        setError(null);
      } catch (err) {
        console.error("Error loading stations:", err);
        setError("Error al cargar las estaciones. Verifica tu conexión.");
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  const filteredStations = useMemo(
    () =>
      stations.filter((station) => {
        const search = normalizeSearch(query);
        if (!search) return true;
        return [station.nombreEstacion, station.subcuenca, station.poblacion]
          .join(" ")
          .toLowerCase()
          .includes(search);
      }),
    [query, stations],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AlertsPanel />
        <section className="mb-10 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard SAIH</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Análisis inteligente de caudales SAIH</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Explora las estaciones, busca por nombre, subcuenca o población y accede al análisis detallado de cada variable.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <a
                href="/experimentos"
                className="rounded-3xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                🧪 Experimentos LLMs
              </a>
              {!loading && (
                <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-inner">
                  {filteredStations.length} estación{filteredStations.length === 1 ? "" : "es"} encontradas
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-700">Buscar estación</label>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre de estación, subcuenca o población"
              disabled={loading}
              className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full rounded-4xl border border-dashed border-rose-300 bg-rose-50 p-10 text-center text-rose-700">
              {error}
            </div>
          ) : filteredStations.length > 0 ? (
            filteredStations.map((station) => <StationCard key={station.idVariable} station={station} />)
          ) : (
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              No se encontraron estaciones para esa búsqueda.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
