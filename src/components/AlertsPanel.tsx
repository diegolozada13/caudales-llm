"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  stationName: string;
  risk: "High" | "Medium" | "Low";
  reason: string;
  value: number;
  threshold: number;
}

export const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/sentinel/check");
        const data = await response.json();
        if (data.alerts) {
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          Alertas de Riesgo Activas
        </h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
          Sentinel AI Monitoring
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md ${
              alert.risk === "High"
                ? "bg-rose-50 border-rose-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">
                    {alert.stationName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">ID: {alert.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    alert.risk === "High"
                      ? "bg-rose-500 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {alert.risk === "High" ? "Riesgo Alto" : "Riesgo Medio"}
                </span>
              </div>
              
              <p className={`text-sm mb-4 font-medium ${
                alert.risk === "High" ? "text-rose-800" : "text-amber-800"
              }`}>
                {alert.reason}
              </p>

              <div className="mt-auto pt-4 border-t border-black/5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Caudal Actual</p>
                  <p className={`text-lg font-black ${
                    alert.risk === "High" ? "text-rose-700" : "text-amber-700"
                  }`}>
                    {alert.value.toFixed(2)} <span className="text-xs font-normal">m³/s</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Umbral Crítico</p>
                  <p className="text-sm font-bold text-slate-600">
                    {alert.threshold.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${
              alert.risk === "High" ? "bg-rose-500" : "bg-amber-500"
            }`} />
          </div>
        ))}
      </div>
    </section>
  );
};
