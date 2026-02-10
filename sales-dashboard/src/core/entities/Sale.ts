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
  fecha: string; // ISO String (YYYY-MM-DD)
  cantidad: number;
  relacionACReal: number;
  contenidoCementoReal: number;
  tiempoViaje: number | null;
  tiempoDescarga: number | null;
  descargaTardia: boolean | null;
}

export interface SalesFilters {
  startDate: string | null;
  endDate: string | null;
  fabricas: string[] | null;
  comunidades: string[] | null;
  nomenclaturas: string[] | null;
  transportistas: string[] | null;
  matriculas: string[] | null;
  clientes: string[] | null;
}
