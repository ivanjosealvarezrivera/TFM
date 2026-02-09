import type { Sale } from '../../core/entities/Sale'

export class ExcelService {
  static async processFile(file: File): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./excel.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.onmessage = (event) => {
        const { status, data, message, type, details } = event.data
        if (status === 'success') {
          resolve(data)
        } else {
          const error = new Error(message) as any
          error.type = type
          error.details = details
          reject(error)
        }
        worker.terminate()
      }

      worker.onerror = (error) => {
        reject(error)
        worker.terminate()
      }

      worker.postMessage({ file })
    })
  }
}
