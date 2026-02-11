import * as XLSX from 'xlsx'
import { SalesMapper } from '../mappers/SalesMapper'
import type { RawExcelSale } from '../types/ExcelRow'

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data
  
  try {
    const arrayBuffer = await (file as File).arrayBuffer()
    
    // --- FASE 1: LECTURA ÚNICA ---
    // Leemos todo el workbook una sola vez con modo denso para eficiencia de memoria
    self.postMessage({ status: 'reading', message: 'Cargando archivo...' })
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      dense: true, 
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false
    })
    
    const mainSheetName = workbook.SheetNames[0]
    if (!mainSheetName) throw new Error('El archivo Excel no tiene hojas')
    
    const worksheet = workbook.Sheets[mainSheetName]
    if (!worksheet) throw new Error(`No se pudo acceder a la hoja: ${mainSheetName}`)
    
    // Obtener todas las filas como array de arrays (modo rápido con dense: true)
    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }) as any[][]
    if (allRows.length === 0) throw new Error('El archivo está vacío')
    
    const headersRaw = allRows[0]
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

    const uniqueKeysSet = new Set<string>()
    const sales: any[] = []
    let processedCount = 0

    self.postMessage({ status: 'reading', message: `Procesando ${allRows.length - 1} registros...` })

    // Procesar TODAS las filas
    for (let i = 1; i < allRows.length; i++) {
      const rowArr = allRows[i]
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
        if (!uniqueKeysSet.has(key)) {
          uniqueKeysSet.add(key)
          const entity = SalesMapper.mapRowToEntity(row)
          if (entity) {
            sales.push(entity)
            processedCount++
          }
        }
      }
    }

    // Finalizar proceso enviando TODOS los datos de una vez
    self.postMessage({ 
      status: 'success', 
      data: sales, 
      totalProcessed: processedCount
    })
  } catch (error: any) {
    self.postMessage({ status: 'error', message: error.message })
  }
}
