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

    const uniqueRowsMap = new Map<string, RawExcelSale>()
    const CHUNK_SIZE = 5000
    let processedCount = 0

    // --- FASE 2: VISTA PREVIA INSTANTÁNEA (5000 registros) ---
    self.postMessage({ status: 'reading', message: 'Generando vista previa instantánea...' })
    const previewWorkbook = XLSX.read(arrayBuffer, { 
      type: 'array', 
      sheetRows: CHUNK_SIZE + 1,
      cellDates: true 
    })
    const previewSheet = previewWorkbook.Sheets[mainSheetName]
    if (previewSheet) {
      const previewJson: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(previewSheet, { header: 1, raw: true })
      const previewSales: any[] = []
      
      for (let i = 1; i < previewJson.length; i++) {
        const rowArr = previewJson[i]
        if (!rowArr || rowArr.length === 0) continue
        const row: RawExcelSale = {}
        headers.forEach((header, index) => { if (header) row[header] = rowArr[index] })
        
        if (row['Anulado'] !== 'N') continue
        const cabecera = row['CabeceraNomenclaturaReducida']
        if (cabecera === 'A' || cabecera === 'O') continue
        const nombrePlanta = row['Nombre planta']
        const numeroAlbaran = row['Número albarán']
        
        if (nombrePlanta && numeroAlbaran) {
          const key = `${nombrePlanta}|${numeroAlbaran}`
          if (!uniqueRowsMap.has(key)) {
            uniqueRowsMap.set(key, row)
            const entity = SalesMapper.mapRowToEntity(row)
            if (entity) { previewSales.push(entity); processedCount++ }
          }
        }
      }
      if (previewSales.length > 0) {
        self.postMessage({ status: 'progress', data: previewSales, totalProcessed: processedCount })
      }
    }

    // --- FASE 3: LECTURA COMPLETA ---
    self.postMessage({ status: 'reading', message: 'Abriendo archivo completo (esto liberará el resto de datos)...' })
    
    // Optimizamos la lectura desactivando todo lo que no necesitamos y usando modo 'dense' para mayor velocidad
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      dense: true, 
      sheets: [mainSheetName],
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
      cellDates: true 
    })
    const worksheet = workbook.Sheets[mainSheetName]
    if (!worksheet) throw new Error(`Error en la lectura completa de la hoja: ${mainSheetName}`)

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    const totalRows = range.e.r
    const sales: any[] = []

    self.postMessage({ status: 'reading', message: `Procesando ${totalRows} registros...` })

    // Empezamos desde donde terminó la vista previa para ser más eficientes
    for (let startRow = CHUNK_SIZE + 1; startRow <= totalRows; startRow += CHUNK_SIZE) {
      const endRow = Math.min(startRow + CHUNK_SIZE - 1, totalRows)
      const chunkJson: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        range: { s: { r: startRow, c: range.s.c }, e: { r: endRow, c: range.e.c } },
        raw: true
      })

      for (const rowArr of chunkJson) {
        if (!rowArr || rowArr.length === 0) continue
        
        const row: RawExcelSale = {}
        headers.forEach((header, index) => {
          if (header) {
            row[header] = rowArr[index]
          }
        })

        if (row['Anulado'] !== 'N') continue
        const cabecera = row['CabeceraNomenclaturaReducida']
        if (cabecera === 'A' || cabecera === 'O') continue

        const nombrePlanta = row['Nombre planta']
        const numeroAlbaran = row['Número albarán']
        
        if (nombrePlanta && numeroAlbaran) {
          const key = `${nombrePlanta}|${numeroAlbaran}`
          if (!uniqueRowsMap.has(key)) {
            uniqueRowsMap.set(key, row)
            const entity = SalesMapper.mapRowToEntity(row)
            if (entity) {
              sales.push(entity)
              processedCount++
            }
          }
        }
      }

      // Enviar el chunk actual inmediatamente después de procesar el rango
      if (sales.length > 0) {
        self.postMessage({ 
          status: 'progress', 
          data: [...sales],
          totalProcessed: processedCount 
        })
        sales.length = 0 // Vaciar para el siguiente bloque
      }
    }

    // Finalizar proceso
    self.postMessage({ 
      status: 'success', 
      data: [], // Ya se envió todo via progress
      totalProcessed: processedCount
    })
  } catch (error: any) {
    self.postMessage({ status: 'error', message: error.message })
  }
}
