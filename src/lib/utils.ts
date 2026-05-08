import type { Umbrales } from "@/src/lib/mock-data";

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};

export const formatHour = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};

export const formatNumber = (value: number, digits = 1): string =>
  value.toFixed(digits).replace(".0", "") + " m³/s";

export const normalizeSearch = (value: string): string =>
  value.trim().toLowerCase();

export const calculateEstado = (valor: number, umbrales: Umbrales): string => {
  if (valor <= umbrales.bajo) {
    return "Bajo";
  }
  if (valor <= umbrales.medio) {
    return "Medio";
  }
  if (valor <= umbrales.alto) {
    return "Alto";
  }
  return "Crítico";
};

export const estadoColor = (estado: string): string => {
  switch (estado) {
    case "Bajo":
      return "bg-emerald-100 text-emerald-800";
    case "Medio":
      return "bg-amber-100 text-amber-800";
    case "Alto":
      return "bg-orange-100 text-orange-900";
    case "Crítico":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
};
