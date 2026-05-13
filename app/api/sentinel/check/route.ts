import { NextResponse } from "next/server";
import { getCaudales } from "@/src/lib/api";
import { getPredictedRainfall } from "@/src/lib/weather";
import { analyzeStationRisk } from "@/src/lib/sentinel-logic";

export async function GET() {
  try {
    const stations = await getCaudales();
    const alerts = [];

    for (const station of stations) {
      // Get predicted rain for the station's coordinates
      const predictedRain = await getPredictedRainfall(station.latitud, station.longitud);
      
      // Analyze risk
      const risk = analyzeStationRisk(station, predictedRain);

      if (risk === "High" || risk === "Medium") {
        let reason = "";
        const isNearThreshold = station.valorActual >= station.umbrales.alto * 0.9;
        const hasSignificantRain = predictedRain > 5;

        if (isNearThreshold && hasSignificantRain) {
          reason = "Caudal crítico y predicción de lluvias intensas.";
        } else if (isNearThreshold) {
          reason = "Caudal muy cercano al umbral de alerta.";
        } else if (hasSignificantRain) {
          reason = `Predicción de lluvias significativas (${predictedRain.toFixed(1)}mm).`;
        }

        alerts.push({
          id: station.idVariable,
          stationName: station.nombreEstacion,
          risk,
          reason,
          value: station.valorActual,
          threshold: station.umbrales.alto,
        });
      }
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error in sentinel check:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
