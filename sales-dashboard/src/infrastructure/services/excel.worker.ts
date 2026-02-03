import * as XLSX from 'xlsx'
import { SalesMapper } from '../mappers/SalesMapper'

self.onmessage = async (event: MessageEvent) => {
  const { arrayBuffer } = event.data
  
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) throw new Error('Excel has no sheets')
    const worksheet = workbook.Sheets[firstSheetName]
    if (!worksheet) throw new Error('Worksheet not found')
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
    
    if (jsonData.length === 0) throw new Error('Excel is empty')
    
    const headersRaw = jsonData[0]
    if (!headersRaw) throw new Error('No headers found')
    const headers = headersRaw.map(h => h?.toString().trim() || '')
    const uniqueRowsMap = new Map<string, any>()
    
    for (let i = 1; i < jsonData.length; i++) {
      const rowArr = jsonData[i] as any[]
      if (!rowArr || rowArr.length === 0) continue
      
      const row: Record<string, any> = {}
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
