"use client";

import EChartsReact from "echarts-for-react";
import type { HistoryPoint, Umbrales } from "@/src/lib/mock-data";
import { formatHour } from "@/src/lib/utils";

interface StationChartProps {
  series: HistoryPoint[];
  thresholds: Umbrales;
  predictionPoint?: HistoryPoint;
}

export function StationChart({ series, thresholds, predictionPoint }: StationChartProps) {
  const labels = series.map((point) => formatHour(point.fechaHora));
  const values = series.map((point) => point.valor);
  const predictionLabel = predictionPoint ? formatHour(predictionPoint.fechaHora) : undefined;
  const chartLabels = predictionLabel ? [...labels, predictionLabel] : labels;
  const predictionSeriesData = predictionPoint ? [...values, null] : values;
  const predictionScatter = predictionPoint ? [[labels.length, predictionPoint.valor]] : [];

  const options = {
    color: ["#2563EB", "#10B981", "#f59e0b"],
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `${item.axisValue}<br />${item.seriesName}: ${item.data} m³/s`;
      },
    },
    grid: {
      left: "12%",
      right: "6%",
      top: "14%",
      bottom: "12%",
    },
    xAxis: {
      type: "category",
      data: chartLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { color: "#64748b", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } },
      axisLabel: { color: "#64748b", formatter: "{value} m³/s" },
    },
    series: [
      {
        name: "Caudal",
        type: "line",
        data: predictionPoint ? [...values, null] : values,
        smooth: true,
        lineStyle: { width: 3, borderCap: "round" },
        areaStyle: { opacity: 0.08 },
        showSymbol: false,
      },
      {
        name: "Umbrales",
        type: "line",
        data: Array(chartLabels.length).fill(thresholds.medio),
        lineStyle: {
          type: "dashed",
          width: 1,
          color: "#f59e0b",
        },
        symbol: "none",
        markLine: {
          silent: true,
          data: [
            { yAxis: thresholds.bajo, name: "Bajo", label: { formatter: "Bajo", position: "end" } },
            { yAxis: thresholds.medio, name: "Medio", label: { formatter: "Medio", position: "end" } },
            { yAxis: thresholds.alto, name: "Alto", label: { formatter: "Alto", position: "end" } },
          ],
          lineStyle: { type: "dotted", color: "#94a3b8" },
        },
      },
      {
        name: "Predicción +1h",
        type: "scatter",
        data: predictionScatter,
        symbolSize: 12,
        itemStyle: { color: "#14b8a6" },
      },
    ],
  };

  return (
    <div className="h-90 rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Últimas 24h</p>
          <h3 className="text-lg font-semibold text-slate-900">Tendencia de caudal</h3>
        </div>
      </div>
      <EChartsReact option={options} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
