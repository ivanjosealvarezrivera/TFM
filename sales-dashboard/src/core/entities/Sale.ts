export interface Sale {
  id: string; // Nombre planta + | + Número albarán
  planta: string;
  comunidad: string; // Prefijo de la planta
  grupo: string; // CabeceraNomenclaturaReducida-ResistenciaFormula
  nomenclatura: string;
  articulo: string; // Tamaño Fórmula
  calidad: string; // Consistencia Fórmula
  envase: string; // Exposición combinada
  cliente: string; // NIF
  nombreCliente: string;
  matricula: string;
  nombreTransportista: string;
  fecha: Date;
  cantidad: number;
  relacionACReal: number;
  contenidoCementoReal: number;
  tiempoViaje: number | null;
  tiempoDescarga: number | null;
  descargaTardia: boolean | null;
}

export interface SalesFilters {
  startDate: Date | null;
  endDate: Date | null;
  fabrica: string | null;
  fabricaPrefix: string | null;
  grupo: string | null;
  truck: string | null;
  transportista: string | null;
}
