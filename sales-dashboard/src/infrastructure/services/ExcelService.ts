import type { Sale } from '../../core/entities/Sale'

export class ExcelService {
  static async processFile(file: File, onProgress?: (chunk: Sale[], total: number, step?: string) => void): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./excel.worker.ts', import.meta.url), {
        type: 'module'
      })

      const allSales: Sale[] = []

      worker.onmessage = (event) => {
        const { status, data, message, type, details, totalProcessed } = event.data
        if (status === 'reading') {
          if (onProgress) onProgress([], 0, message)
        } else if (status === 'progress') {
          if (onProgress) onProgress(data, totalProcessed)
          allSales.push(...data)
        } else if (status === 'success') {
          if (data && data.length > 0 && onProgress) onProgress(data, totalProcessed)
          allSales.push(...data)
          resolve(allSales)
          worker.terminate()
        } else {
          const error = new Error(message) as any
          error.type = type
          error.details = details
          reject(error)
          worker.terminate()
        }
      }

      worker.onerror = (error) => {
        reject(error)
        worker.terminate()
      }

      worker.postMessage({ file })
    })
  }
}
