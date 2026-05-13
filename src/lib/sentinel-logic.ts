import type { StationVariable } from "./mock-data";
import { getAIRiskSummary as getSummaryFromAI } from "./llm";

/**
 * Logic: 
 * - High: Current flow is near the alto threshold (>= 90%) AND rain is predicted (> 5mm).
 * - Medium: Only one of the above is true.
 * - Low: Neither is true.
 */
export function analyzeStationRisk(station: StationVariable, predictedRain: number): "High" | "Medium" | "Low" {
  const isNearThreshold = station.valorActual >= station.umbrales.alto * 0.9;
  const hasSignificantRain = predictedRain > 5;

  if (isNearThreshold && hasSignificantRain) return "High";
  if (isNearThreshold || hasSignificantRain) return "Medium";
  return "Low";
}

/**
 * Sends a prompt to the LLM with station data + rain forecast to get a "Natural Language Risk Summary".
 */
export async function getAIRiskSummary(station: StationVariable, predictedRain: number): Promise<string> {
  return getSummaryFromAI(station, predictedRain);
}
