import Link from "next/link";
import type { StationVariable } from "@/src/lib/mock-data";
import { calculateEstado, formatDateTime, formatNumber, estadoColor } from "@/src/lib/utils";

interface StationCardProps {
  station: StationVariable;
}

export function StationCard({ station }: StationCardProps) {
  const estado = calculateEstado(station.valorActual, station.umbrales);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{station.subcuenca}</p>
          <h2 className="text-xl font-semibold text-slate-900">{station.nombreEstacion}</h2>
          <p className="text-sm text-slate-600">{station.nombreVariable}</p>
        </div>
        <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${estadoColor(estado)}`}>
          {estado}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Provincia</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{station.provincia}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Población</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{station.poblacion}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Valor actual</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatNumber(station.valorActual)}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(station.fechaHora)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Umbral bajo</p>
          <p className="mt-2 font-semibold text-slate-900">{formatNumber(station.umbrales.bajo)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Umbral medio</p>
          <p className="mt-2 font-semibold text-slate-900">{formatNumber(station.umbrales.medio)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Umbral alto</p>
          <p className="mt-2 font-semibold text-slate-900">{formatNumber(station.umbrales.alto)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">ID: {station.idVariable}</p>
        <Link href={`/estacion/${station.idVariable}`} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Ver análisis
        </Link>
      </div>
    </div>
  );
}
