export interface RawExcelSale {
  'Nombre planta'?: string;
  'Fecha Dosificación Albarán'?: string | number | Date;
  'Hora Salida Planta Albarán'?: string | number | Date;
  'Hora Llegada Obra Albarán'?: string | number | Date;
  'Hora Inicio Descarga Albarán'?: string | number | Date;
  'Hora Fin Descarga'?: string | number | Date;
  'Hora Limite Uso Albarán'?: string | number | Date;
  'CabeceraNomenclaturaReducida'?: string;
  'Resistencia Fórmula'?: string;
  'Número albarán'?: string | number;
  'NIF Cliente'?: string;
  'Nombre cliente'?: string;
  'Matricula Camión'?: string;
  'Nombre Transportista'?: string;
  'Volumen Facturar Albarán'?: string | number;
  'Contenido Cemento Real Fórmula'?: string | number;
  'Anulado'?: string;
  [key: string]: any; // Allow for other fields but type the main ones
}
