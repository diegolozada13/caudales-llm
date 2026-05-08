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
  const predictionScatter = predictionPoint ? [[labels.length, predictionPoint.valor]] : [];

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const thresholdsToShow = [
    { value: thresholds.bajo, name: "Bajo" },
    { value: thresholds.medio, name: "Medio" },
    { value: thresholds.alto, name: "Alto" },
  ].filter((threshold) => threshold.value >= minValue - range * 0.2 && threshold.value <= maxValue + range * 0.2);

  const options = {
    color: ["#2563EB", "#f59e0b", "#14b8a6"],
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
        markLine: thresholdsToShow.length
          ? {
              silent: true,
              data: thresholdsToShow.map((threshold) => ({
                yAxis: threshold.value,
                name: threshold.name,
                label: { formatter: threshold.name, position: "end" },
              })),
              lineStyle: { type: "dotted", color: "#94a3b8" },
            }
          : undefined,
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
