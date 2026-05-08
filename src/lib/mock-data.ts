export interface Umbrales {
  bajo: number;
  medio: number;
  alto: number;
}

export interface HistoryPoint {
  fechaHora: string;
  valor: number;
}

export interface StationVariable {
  idVariable: string;
  nombreEstacion: string;
  nombreVariable: string;
  subcuenca: string;
  provincia: string;
  poblacion: string;
  valorActual: number;
  fechaHora: string;
  umbrales: Umbrales;
  valores24h: HistoryPoint[];
}

const fechaBase = new Date("2026-05-08T00:00:00Z");

const buildSeries = (base: Date, values: number[]) =>
  values.map((valor, index) => {
    const fecha = new Date(base);
    fecha.setUTCHours(base.getUTCHours() + index);
    return {
      fechaHora: fecha.toISOString(),
      valor,
    };
  });

export const stationVariables: StationVariable[] = [
  {
    idVariable: "sa-001",
    nombreEstacion: "Estación Río Dulce",
    nombreVariable: "Caudal instantáneo",
    subcuenca: "Río Dulce",
    provincia: "Guadalajara",
    poblacion: "Sigüenza",
    valorActual: 28.4,
    fechaHora: "2026-05-08T22:00:00Z",
    umbrales: {
      bajo: 12,
      medio: 22,
      alto: 35,
    },
    valores24h: buildSeries(fechaBase, [10, 11, 12, 12.5, 14, 16, 18, 20, 21, 22, 23, 24, 25, 26, 26.5, 27, 27.8, 28.1, 28.5, 28.6, 28.7, 28.8, 28.9, 29]),
  },
  {
    idVariable: "sa-002",
    nombreEstacion: "Estación Alto Tajo",
    nombreVariable: "Caudal instantáneo",
    subcuenca: "Tajo Alto",
    provincia: "Cuenca",
    poblacion: "Cañete",
    valorActual: 7.9,
    fechaHora: "2026-05-08T22:00:00Z",
    umbrales: {
      bajo: 8,
      medio: 14,
      alto: 24,
    },
    valores24h: buildSeries(fechaBase, [6.4, 6.7, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.6, 7.7, 7.8, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.2, 8.1, 8.0, 7.95, 7.9]),
  },
  {
    idVariable: "sa-003",
    nombreEstacion: "Estación Alberche",
    nombreVariable: "Caudal instantáneo",
    subcuenca: "Río Alberche",
    provincia: "Madrid",
    poblacion: "Aranjuez",
    valorActual: 19.6,
    fechaHora: "2026-05-08T22:00:00Z",
    umbrales: {
      bajo: 10,
      medio: 18,
      alto: 28,
    },
    valores24h: buildSeries(fechaBase, [12, 12.5, 13, 13.8, 14.5, 15.3, 16.0, 16.6, 17.2, 17.8, 18.3, 18.7, 19.0, 19.2, 19.4, 19.6, 19.7, 19.7, 19.6, 19.4, 19.1, 18.8, 18.4, 18.0]),
  },
];

export const getStationVariables = (): StationVariable[] => stationVariables;

export const getStationVariableById = (idVariable: string): StationVariable | undefined =>
  stationVariables.find((item) => item.idVariable === idVariable);
