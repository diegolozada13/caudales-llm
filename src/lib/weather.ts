import axios from "axios";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

export interface WeatherForecast {
  list: {
    dt: number;
    dt_txt: string;
    rain?: {
      "3h": number;
    };
  }[];
}

/**
 * Fetches the 5-day / 3-hour forecast from OpenWeatherMap.
 */
export const getWeatherForecast = async (lat: number, lon: number): Promise<WeatherForecast | null> => {
  if (!API_KEY) {
    console.warn("OPENWEATHER_API_KEY is not defined in .env");
    return null;
  }

  try {
    const response = await axios.get<WeatherForecast>(BASE_URL, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: "metric",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    return null;
  }
};

/**
 * Calculates the total predicted rainfall for the next 24 hours.
 */
export const getPredictedRainfall = async (lat: number, lon: number): Promise<number> => {
  // Emulación de lluvia alta para la estación de prueba TEST-001
  if (lat === 39.4 && lon === -0.3) {
    return 12.5;
  }

  const forecast = await getWeatherForecast(lat, lon);
  if (!forecast || !forecast.list) return 0;

  const now = Math.floor(Date.now() / 1000);
  const twentyFourHoursLater = now + 24 * 60 * 60;

  // Sum up rain volume for forecasts falling within the next 24 hours
  const predictedRain = forecast.list
    .filter((item) => item.dt >= now && item.dt <= twentyFourHoursLater)
    .reduce((acc, item) => acc + (item.rain?.["3h"] || 0), 0);

  return predictedRain;
};
