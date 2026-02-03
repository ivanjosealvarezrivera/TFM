import type { Sale } from '../../core/entities/Sale'
import type { RawExcelSale } from '../types/ExcelRow'

export class SalesMapper {
  private static parseExcelDate(value: string | number | Date | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    
    if (typeof value === 'number') {
      // Excel serial date 
      const date = new Date((value - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    
    if (typeof value === 'string') {
      // Handle "DD/MM/YYYY" or "DD/MM/YYYY HH:MM:SS"
      const datePart = value.split(' ')[0];
      if (!datePart) return null;
      const parts = datePart.split('/');
      if (parts.length === 3) {
        const dStr = parts[0];
        const mStr = parts[1];
        const yStr = parts[2];
        if (dStr && mStr && yStr) {
          const day = Number(dStr);
          const month = Number(mStr);
          const year = Number(yStr);
          const date = new Date(Date.UTC(year, month - 1, day));
          return isNaN(date.getTime()) ? null : date;
        }
      }
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  }

  private static parseExcelDateTime(value: string | number | Date | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        return isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'string') {
        const parts = value.split(' ');
        if (parts.length === 2) {
            const dateParts = (parts[0] || '').split('/');
            const timeParts = (parts[1] || '').split(':');
            if (dateParts.length === 3 && timeParts.length === 3) {
                const dStr = dateParts[0];
                const mStr = dateParts[1];
                const yStr = dateParts[2];
                const hStr = timeParts[0];
                const minStr = timeParts[1];
                const sStr = timeParts[2];
                
                if (dStr && mStr && yStr && hStr && minStr && sStr) {
                    const day = Number(dStr);
                    const month = Number(mStr);
                    const year = Number(yStr);
                    const hour = Number(hStr);
                    const minute = Number(minStr);
                    const second = Number(sStr);
                    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
                    return isNaN(date.getTime()) ? null : date;
                }
            }
        }
    }
    return null;
  }

  static cleanLicensePlate(plate: string | number | undefined): string {
    if (plate === undefined || plate === null) return '';
    return plate.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private static parseExcelNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  static mapRowToEntity(row: RawExcelSale): Sale | null {
    const cabeceraNomenclaturaReducidaRaw = row['CabeceraNomenclaturaReducida'];
    const resistenciaFormula = row['Resistencia Fórmula'] || '';
    const planta = row['Nombre planta'] || '';
    
    const dateValue = row['Fecha Dosificación Albarán'];
    if (!dateValue) return null;
    const fecha = this.parseExcelDate(dateValue);
    if (!fecha) return null;

    const horaSalidaValue = row['Hora Salida Planta Albarán'];
    const horaLlegadaValue = row['Hora Llegada Obra Albarán'];
    const horaInicioDescargaValue = row['Hora Inicio Descarga Albarán'];
    const horaFinDescargaValue = row['Hora Fin Descarga'];
    const horaLimiteUsoValue = row['Hora Limite Uso Albarán'];

    const horaSalida = this.parseExcelDateTime(horaSalidaValue);
    const horaLlegada = this.parseExcelDateTime(horaLlegadaValue);
    const horaInicioDescarga = this.parseExcelDateTime(horaInicioDescargaValue);
    const horaFinDescarga = this.parseExcelDateTime(horaFinDescargaValue);
    const horaLimiteUso = this.parseExcelDateTime(horaLimiteUsoValue);

    const tiempoViaje = (horaSalida && horaLlegada && horaLlegada >= horaSalida) 
        ? (horaLlegada.getTime() - horaSalida.getTime()) / (1000 * 60) 
        : null;

    const tiempoDescarga = (horaInicioDescarga && horaFinDescarga && horaFinDescarga >= horaInicioDescarga)
        ? (horaFinDescarga.getTime() - horaInicioDescarga.getTime()) / (1000 * 60)
        : null;

    const descargaTardia = (horaFinDescarga && horaLimiteUso)
        ? horaFinDescarga > horaLimiteUso
        : null;

    const expoParts = [
        row['Exposición General Fórmula'],
        row['Exposición Especifica 1 Fórmula'],
        row['Exposición Especifica 2 Fórmula'],
        row['Exposición Especifica 3 Fórmula']
    ].filter(Boolean);

    return {
      id: `${planta}|${row['Número albarán']}`,
      planta,
      comunidad: (planta.length >= 2) ? planta.substring(0, 2).toUpperCase() : 'OT',
      grupo: `${cabeceraNomenclaturaReducidaRaw || ''}-${resistenciaFormula}`,
      nomenclatura: `${cabeceraNomenclaturaReducidaRaw || ''}-${resistenciaFormula}`,
      articulo: row['Tamaño Fórmula'] || '',
      calidad: row['Consistencia Fórmula'] || '',
      envase: expoParts.join('+'),
      cliente: row['NIF Cliente'] || '',
      nombreCliente: row['Nombre cliente'] || '',
      matricula: this.cleanLicensePlate(row['Matricula Camión'] || ''),
      nombreTransportista: row['Nombre Transportista'] || '',
      fecha: fecha.toISOString().split('T')[0] || '',
      cantidad: this.parseExcelNumber(row['Volumen Facturar Albarán']),
      relacionACReal: this.parseExcelNumber(row['Relación A/C Real Fórmula']),
      contenidoCementoReal: this.parseExcelNumber(row['Contenido Cemento Real Fórmula']),
      tiempoViaje,
      tiempoDescarga,
      descargaTardia
    };
  }
}
