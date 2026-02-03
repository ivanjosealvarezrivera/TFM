import type { Sale } from '../../core/entities/Sale'

export class ExcelService {
  static async processFile(file: File): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result
        const worker = new Worker(new URL('./excel.worker.ts', import.meta.url), {
          type: 'module'
        })

        worker.onmessage = (event) => {
          const { status, data, message } = event.data
          if (status === 'success') {
            resolve(data)
          } else {
            reject(new Error(message))
          }
          worker.terminate()
        }

        worker.onerror = (error) => {
          reject(error)
          worker.terminate()
        }

        worker.postMessage({ arrayBuffer })
      }

      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsArrayBuffer(file)
    })
  }
}
