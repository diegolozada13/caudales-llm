import saihClient from "@/src/lib/axios-config";
import type { StationVariable, HistoryPoint, Umbrales } from "@/src/lib/mock-data";

interface SAIHCaudal {
  idVariable: string;
  nombreVariable: string;
  idEstacion: string;
  nombreEstacion: string;
  latitud: number;
  longitud: number;
  subcuenca: string;
  provincia: string;
  poblacion: string;
  umbralBajo: number;
  umbralMedio: number;
  umbralAlto: number;
  valor: number;
  fechaHora: string;
  estado: number;
}

interface SAIHValor {
  fechaHora: string;
  valor: number;
  estado: number;
}

interface SAIHVariable {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  unidades: string;
  estacion: string;
}

interface SAIHResponse<T> {
  data: T[];
  meta?: {
    paginaActual: number;
    totalPaginas: number;
    elementosPorPagina: number;
    elementosPagina: number;
    totalElementos: number;
  };
}

const defaultThresholds: Umbrales = {
  bajo: 10,
  medio: 20,
  alto: 35,
};

const parseDate = (dateStr: string | undefined): string => {
  if (!dateStr) return new Date().toISOString();
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const buildUtcIsoDateTime = (date: Date): string => {
  return date.toISOString().split(".")[0] + "Z";
};

const fetchAllPages = async <T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> => {
  const firstResponse = await saihClient.get<SAIHResponse<T>>(url, {
    params: {
      ...params,
      pagina: 0,
    },
  });

  const firstPageData = firstResponse.data?.data || [];
  const totalPages = firstResponse.data?.meta?.totalPaginas ?? 1;

  if (totalPages <= 1) {
    return firstPageData;
  }

  const pageRequests = [];
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(
      saihClient.get<SAIHResponse<T>>(url, {
        params: {
          ...params,
          pagina: page,
        },
      }),
    );
  }

  const pageResponses = await Promise.all(pageRequests);
  return pageResponses.reduce<T[]>(
    (acc, response) => [...acc, ...(response.data?.data || [])],
    firstPageData,
  );
};

export const getCaudales = async (): Promise<StationVariable[]> => {
  try {
    const caudales = await fetchAllPages<SAIHCaudal>("caudales");

    const stations: StationVariable[] = caudales.map((caudal) => ({
      idVariable: caudal.idVariable || "",
      nombreEstacion: caudal.nombreEstacion || "Estación sin nombre",
      nombreVariable: caudal.nombreVariable || "Variable sin nombre",
      subcuenca: caudal.subcuenca || "Subcuenca desconocida",
      provincia: caudal.provincia || "Provincia desconocida",
      poblacion: caudal.poblacion || "Población desconocida",
      latitud: caudal.latitud ?? 0,
      longitud: caudal.longitud ?? 0,
      valorActual: caudal.valor ?? 0,
      fechaHora: parseDate(caudal.fechaHora),
      umbrales: {
        bajo: caudal.umbralBajo ?? defaultThresholds.bajo,
        medio: caudal.umbralMedio ?? defaultThresholds.medio,
        alto: caudal.umbralAlto ?? defaultThresholds.alto,
      },
      valores24h: [],
    }));
    return stations;

  } catch (error) {
    console.error("Error fetching caudales:", error);
    throw error;
  }
};

export const getVariableInfo = async (idVariable: string): Promise<SAIHVariable | null> => {
  try {
    const response = await saihClient.get<SAIHVariable>(`variables/${idVariable}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variable ${idVariable}:`, error);
    return null;
  }
};

export const getVariableValores = async (
  idVariable: string,
  fechaIni: string,
  fechaFin: string,
): Promise<HistoryPoint[]> => {
  try {
    const valores = await fetchAllPages<SAIHValor>(`variables/${idVariable}/valores`, {
      fechaIni,
      fechaFin,
    });

    return valores
      .map((valor) => ({
        fechaHora: parseDate(valor.fechaHora),
        valor: valor.valor ?? 0,
      }))
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  } catch (error) {
    console.error(`Error fetching valores for ${idVariable}:`, error);
    throw error;
  }
};

export const getStationVariableById = async (idVariable: string): Promise<StationVariable | null> => {
  try {
    const caudales = await getCaudales();
    const caudal = caudales.find((c) => c.idVariable === idVariable);

    if (!caudal) return null;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const valores24h = await getVariableValores(
      idVariable,
      buildUtcIsoDateTime(oneDayAgo),
      buildUtcIsoDateTime(now),
    ).catch(() => []);

    return {
      ...caudal,
      valores24h,
    };
  } catch (error) {
    console.error(`Error fetching station variable ${idVariable}:`, error);
    return null;
  }
};

export const get24hValues = async (idVariable: string): Promise<HistoryPoint[]> => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return await getVariableValores(
      idVariable,
      buildUtcIsoDateTime(oneDayAgo),
      buildUtcIsoDateTime(now),
    );
  } catch (error) {
    console.error(`Error fetching 24h values for ${idVariable}:`, error);
    return [];
  }
};
