import * as XLSX from 'xlsx'
import { SalesMapper } from '../mappers/SalesMapper'
import type { RawExcelSale } from '../types/ExcelRow'

self.onmessage = async (event: MessageEvent) => {
  const { arrayBuffer } = event.data
  
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) throw new Error('Excel has no sheets')
    const worksheet = workbook.Sheets[firstSheetName]
    if (!worksheet) throw new Error('Worksheet not found')
    const jsonData: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
    
    if (jsonData.length === 0) throw new Error('Excel is empty')
    
    const headersRaw = jsonData[0]
    if (!headersRaw) throw new Error('No headers found')
    const headers = headersRaw.map(h => h?.toString().trim() || '')
    
    // Validación exhaustiva de columnas requeridas por el Mapper y Lógica de Negocio
    const essentialColumns = [
      'Nombre planta',
      'Número albarán',
      'Fecha Dosificación Albarán',
      'Anulado',
      'CabeceraNomenclaturaReducida',
      'Resistencia Fórmula',
      'Tamaño Fórmula',
      'Consistencia Fórmula',
      'Exposición General Fórmula',
      'Exposición Especifica 1 Fórmula',
      'Exposición Especifica 2 Fórmula',
      'Exposición Especifica 3 Fórmula',
      'NIF Cliente',
      'Nombre cliente',
      'Matricula Camión',
      'Nombre Transportista',
      'Volumen Facturar Albarán',
      'Relación A/C Real Fórmula',
      'Contenido Cemento Real Fórmula',
      'Hora Salida Planta Albarán',
      'Hora Llegada Obra Albarán',
      'Hora Inicio Descarga Albarán',
      'Hora Fin Descarga',
      'Hora Limite Uso Albarán'
    ]
    const missingColumns = essentialColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      throw new Error(`Error: El archivo no cumple el contrato de datos. Faltan las siguientes columnas: ${missingColumns.join(', ')}`)
    }

    const uniqueRowsMap = new Map<string, RawExcelSale>()
    
    for (let i = 1; i < jsonData.length; i++) {
      const rowArr = jsonData[i]
      if (!rowArr || rowArr.length === 0) continue
      
      const row: RawExcelSale = {}
      headers.forEach((header, index) => {
        if (header) {
          row[header] = rowArr[index]
        }
      })

      // Validation Rules
      if (row['Anulado'] !== 'N') continue
      const cabecera = row['CabeceraNomenclaturaReducida']
      if (cabecera === 'A' || cabecera === 'O') continue

      const nombrePlanta = row['Nombre planta']
      const numeroAlbaran = row['Número albarán']
      
      if (nombrePlanta && numeroAlbaran) {
        const key = `${nombrePlanta}|${numeroAlbaran}`
        uniqueRowsMap.set(key, row)
      }
    }

    const sales = Array.from(uniqueRowsMap.values())
      .map(row => SalesMapper.mapRowToEntity(row))
      .filter(Boolean)

    self.postMessage({ status: 'success', data: sales })
  } catch (error: any) {
    self.postMessage({ status: 'error', message: error.message })
  }
}
