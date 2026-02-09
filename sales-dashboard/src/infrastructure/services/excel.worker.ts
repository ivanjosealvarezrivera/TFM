import * as XLSX from 'xlsx'
import { SalesMapper } from '../mappers/SalesMapper'
import type { RawExcelSale } from '../types/ExcelRow'

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data
  
  try {
    const arrayBuffer = await (file as File).arrayBuffer()
    // --- FASE 1: LECTURA ULTRA-RÁPIDA (Solo cabeceras) ---
    // Usamos sheetRows: 1 para que XLSX se detenga inmediatamente tras la primera fila.
    const headerWorkbook = XLSX.read(arrayBuffer, { type: 'array', sheetRows: 1 })
    const mainSheetName = headerWorkbook.SheetNames[0]
    if (!mainSheetName) throw new Error('El archivo Excel no tiene hojas')
    
    const headerSheet = headerWorkbook.Sheets[mainSheetName]
    if (!headerSheet) throw new Error(`No se pudo acceder a la hoja: ${mainSheetName}`)
    const headersRaw = (XLSX.utils.sheet_to_json(headerSheet, { header: 1, range: 0, raw: true })[0] as any[])
    if (!headersRaw) throw new Error('No se han encontrado cabeceras en el archivo')
    
    const headers = headersRaw.map(h => h?.toString().trim() || '')
    
    // Validación de columnas requeridas
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
      self.postMessage({ 
        status: 'error', 
        type: 'INVALID_HEADER',
        message: `El archivo no cumple con las columnas requeridas.`,
        details: missingColumns
      })
      return
    }

    // --- FASE 2: LECTURA COMPLETA (Solo si es válido) ---
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[mainSheetName]
    if (!worksheet) throw new Error(`Error en la lectura completa de la hoja: ${mainSheetName}`)

    // Si las cabeceras son correctas, procesamos el resto del archivo
    const jsonData: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
    if (jsonData.length <= 1) throw new Error('El archivo no contiene datos de ventas')

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
