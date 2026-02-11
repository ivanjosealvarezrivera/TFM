import { defineStore } from 'pinia'
import { ref, computed, toRaw, shallowRef } from 'vue'
import type { Sale, SalesFilters } from '../core/entities/Sale'
// @ts-ignore
import tailwindConfig from '../../tailwind.config.js'

export const useSalesStore = defineStore('sales', () => {
  const twColors = (tailwindConfig as any).theme.extend.colors;
  const rawSales = shallowRef<Sale[]>([]) // shallowRef para evitar el overhead de reactividad en miles de objetos
  const isLoading = ref(false)
  const fileError = ref<string | null>(null)
  const fileName = ref<string | null>(null)
  const totalProcessedRecords = ref(0)
  const loadingStep = ref('Procesando datos...')
  
  const filters = ref<SalesFilters>({
    startDate: null,
    endDate: null,
    fabricas: null,
    comunidades: null,
    nomenclaturas: null,
    transportistas: null,
    matriculas: null,
    clientes: null
  })

  // --- Estado de Analítica (Worker) ---
  const workerResults = ref<any>({
    totalVolume: 0,
    volumeByPlanta: {},
    volumeByCommunity: {},
    byDay: { labels: [], values: [] },
    byMonth: { labels: [], values: [] },
    selfConsumptionVolume: 0,
    averageCement: 0,
    uniqueNomenclaturesCount: 0,
    maxSalesDay: null,
    transportistas: {},
    matriculas: {},
    customers: {},
    nomenclatures: {},
    techByPlant: [],
    filteredCount: 0
  })

  const isExcelLoading = ref(false)
  const isCalculating = ref(false)
  const lastAnalysisId = ref(0)
  const lastFinishedAnalysisId = ref(0)
  let analyticsWorker: Worker | null = null

  const initWorker = () => {
    if (analyticsWorker) return
    analyticsWorker = new Worker(new URL('../infrastructure/services/analytics.worker.ts', import.meta.url), { type: 'module' })
    analyticsWorker.onmessage = (e) => {
      if (e.data.error) {
        console.error("Analysis Worker Error:", e.data.detail)
      } else {
        console.log("Analysis Worker Success:", e.data.filteredCount, "records processed")
        workerResults.value = e.data
        if (e.data.filterOptions) {
          filterOptions.value = e.data.filterOptions
        }
      }
      
      const finishedId = e.data.requestId
      if (finishedId !== undefined) {
        lastFinishedAnalysisId.value = finishedId
      }
      
      isCalculating.value = false
      
      // Notificar a todos los que esperan si el análisis actual o posterior ha terminado
      checkPendingResolvers()
    }
    analyticsWorker.onerror = (err) => {
      console.error("Analysis Worker Critical Error:", err)
      isCalculating.value = false
      checkPendingResolvers()
    }
  }

  interface AnalysisResolver {
    id: number
    resolve: () => void
  }
  let pendingResolvers: AnalysisResolver[] = []

  const checkPendingResolvers = () => {
    pendingResolvers = pendingResolvers.filter(r => {
      if (r.id <= lastFinishedAnalysisId.value) {
        r.resolve()
        return false
      }
      return true
    })
  }

  const waitUntilAnalyzed = (targetId?: number) => {
    const idToWait = targetId ?? lastAnalysisId.value
    if (idToWait <= lastFinishedAnalysisId.value) return Promise.resolve()
    
    return new Promise<void>((resolve) => {
      pendingResolvers.push({ id: idToWait, resolve })
    })
  }

  const runAnalysis = () => {
    if (!rawSales.value.length) return
    initWorker()
    isCalculating.value = true
    loadingStep.value = 'Actualizando indicadores y gráficos...'
    lastAnalysisId.value++
    
    analyticsWorker?.postMessage({
      sales: toRaw(rawSales.value),
      filters: toRaw(filters.value),
      requestId: lastAnalysisId.value
    })
  }

  // Monitorizar cambios en filtros o datos para disparar el worker
  // Nota: El debouncing se aplicará en la vista para mayor control de UI
  function triggerAnalysis() {
    runAnalysis()
  }

  // Opciones para Filtros (Valores únicos)
  // Ahora se calculan en el worker para no bloquear el hilo principal
  const filterOptions = ref<{
    fabricas: string[],
    comunidades: string[],
    nomenclaturas: string[],
    transportistas: string[],
    matriculas: string[],
    clientes: { label: string, value: string }[]
  }>({
    fabricas: [],
    comunidades: [],
    nomenclaturas: [],
    transportistas: [],
    matriculas: [],
    clientes: []
  })

  // Exponer propiedades individuales desde workerResults para compatibilidad
  const totalVolume = computed(() => workerResults.value.totalVolume || 0)
  const volumeByPlanta = computed(() => workerResults.value.volumeByPlanta || {})
  const volumeByCommunity = computed(() => workerResults.value.volumeByCommunity || {})
  const salesByDay = computed(() => workerResults.value.byDay || { labels: [], values: [] })
  const salesByMonth = computed(() => workerResults.value.byMonth || { labels: [], values: [] })
  const selfConsumptionVolume = computed(() => workerResults.value.selfConsumptionVolume || 0)
  const averageCementContent = computed(() => workerResults.value.averageCement || 0)
  const uniqueNomenclaturesCount = computed(() => workerResults.value.uniqueNomenclaturesCount || 0)
  const maxSalesDay = computed(() => workerResults.value.maxSalesDay)
  const filteredSales = computed(() => ({ length: workerResults.value.filteredCount || 0 }))
  
  const volumeVariation = computed(() => {
    const months = workerResults.value.byMonth?.values || []
    if (months.length < 2) return 0
    const current = months[months.length - 1]
    const previous = months[months.length - 2]
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  })

  // Cálculos de Medias para Gráficos
  const averageVolumeByPlanta = computed(() => {
    const values = Object.values(volumeByPlanta.value) as number[]
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByDay = computed(() => {
    const values = salesByDay.value.values as number[]
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByMonth = computed(() => {
    const values = salesByMonth.value.values as number[]
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const formulaTreemapData = computed(() => {
    const data = workerResults.value.rawByNomenclature || {}
    const labels: string[] = []
    const parents: string[] = []
    const values: number[] = []
    const text: string[] = []
    const totalFilteredVolume = totalVolume.value

    Object.entries(data).forEach(([nom, info]: [string, any]) => {
      labels.push(nom)
      parents.push("")
      values.push(info.volume)
      const percentage = totalFilteredVolume > 0 ? ((info.volume / totalFilteredVolume) * 100).toFixed(0) : 0
      text.push(`${info.volume.toLocaleString()} m³<br>${percentage}%`)
    })

    return [{
      type: "treemap",
      labels,
      parents,
      values,
      text,
      textinfo: "label+text",
      marker: { colorscale: 'Greens', reversescale: true },
      hoverinfo: "label+value+percent parent"
    }]
  })

  const formulaViolinData = computed(() => {
    const nomenclatureData = workerResults.value.rawByNomenclature || {}
    const greenPalette = twColors['chart-greens']
    
    return Object.entries(nomenclatureData)
      .filter(([nom]) => nom.startsWith('HA') || nom.startsWith('HAF'))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nom, info]: [string, any], index) => {
        const color = greenPalette[index % greenPalette.length] || twColors['primary-green']
        return {
          type: 'violin',
          y: info.cementDistribution, // Datos reales del worker
          name: nom,
          box: { visible: true },
          meanline: { visible: true },
          points: 'all',
          jitter: 0.5,
          marker: { size: 2, color: color },
          line: { color: color }
        }
      })
  })

  const volumeByTransportista = computed(() => {
    const data = workerResults.value.transportistas || {}
    return Object.fromEntries(
      Object.entries(data).sort(([, a]: any, [, b]: any) => b.volume - a.volume)
    )
  })

  const volumeByMatricula = computed(() => {
    const data = workerResults.value.matriculas || {}
    return Object.fromEntries(
      Object.entries(data).sort(([, a]: any, [, b]: any) => b.volume - a.volume)
    )
  })
  
  const topTransportista = computed(() => {
    const sorted = Object.entries(volumeByTransportista.value)
    if (!sorted.length) return null
    return { name: sorted[0]![0], volume: (sorted[0]![1] as any).volume }
  })

  const topTruck = computed(() => {
    const sorted = Object.entries(volumeByMatricula.value)
    if (!sorted.length) return null
    return { matricula: sorted[0]![0], volume: (sorted[0]![1] as any).volume }
  })

  const transportTreeMapData = computed(() => {
    const transportistas = workerResults.value.rawByTransportista || {}
    const ids: string[] = [], labels: string[] = [], parents: string[] = [], values: number[] = [], text: string[] = []
    const rootId = "root_transportistas"

    ids.push(rootId); labels.push("Transportistas"); parents.push(""); values.push(totalVolume.value);
    text.push(`${totalVolume.value.toLocaleString()} m³`)

    Object.entries(transportistas).forEach(([transporter, info]: [string, any]) => {
      const transId = `t_${transporter}`
      ids.push(transId); labels.push(transporter); parents.push(rootId);
      values.push(info.volume); text.push(`${info.volume.toLocaleString()} m³`)

      // Añadir nivel de MATRÍCULA
      Object.entries(info.trucksDetail || {}).forEach(([plate, vol]: [string, any]) => {
        ids.push(`${transId}_${plate}`); labels.push(plate); parents.push(transId);
        values.push(vol); text.push(`${vol.toLocaleString()} m³`)
      })
    })

    return [{
      type: "sunburst",
      ids, labels, parents, values, text,
      textinfo: "label+text",
      hoverinfo: "label+value+percent parent",
      branchvalues: "total",
      marker: { colorscale: 'Greens', reversescale: true, line: { width: 2, color: twColors['brand-gray'][0] } }
    }]
  })

  const pivotData = computed(() => {
    const plants = Object.keys(volumeByPlanta.value).sort()
    const byDayPlant = workerResults.value.rawByDayPlant || {}
    const isoDates = Object.keys(byDayPlant).sort()
    
    const rows = isoDates.map(isoDate => {
      const [y, m, d] = isoDate.split('-')
      const dayData = byDayPlant[isoDate] || {}
      const dayTotal = Object.values(dayData).reduce((a: any, b: any) => a + b, 0)
      
      const row: Record<string, any> = { date: `${d}/${m}/${y}`, total: dayTotal }
      plants.forEach(plant => {
        row[plant] = dayData[plant] || 0
      })
      return row
    })

    return { columns: plants, rows, plantTotals: volumeByPlanta.value, grandTotal: totalVolume.value }
  })

  const uniqueClientsCount = computed(() => Object.keys(workerResults.value.customers || {}).length)
  const volumeByCustomer = computed(() => {
    return Object.entries(workerResults.value.customers || {})
      .map(([nif, info]: [string, any]) => [nif, info])
      .sort((a, b) => (b[1] as any).volume - (a[1] as any).volume)
  })

  const topClient = computed(() => {
    const sorted = volumeByCustomer.value
    if (!sorted.length) return { nif: '', name: '', volume: 0 }
    const first = sorted[0]!
    return { nif: first[0], name: (first[1] as any).name, volume: (first[1] as any).volume }
  })

  const top3ClientsInfo = computed(() => {
    const top3 = volumeByCustomer.value.slice(0, 3)
    return {
      volume: top3.reduce((acc, [, info]: any) => acc + info.volume, 0),
      names: top3.map(([, info]: any) => info.name).join('\n'),
      count: top3.length
    }
  })

  const top10ClientsInfo = computed(() => {
    const top10 = volumeByCustomer.value.slice(0, 10)
    return {
      volume: top10.reduce((acc, [, info]: any) => acc + info.volume, 0),
      names: top10.map(([, info]: any) => info.name).join('\n'),
      count: top10.length
    }
  })

  const concentrationData = computed(() => {
    const top10Vol = top10ClientsInfo.value.volume
    return { labels: ['Top 10 Clientes', 'Resto'], values: [top10Vol, Math.max(0, totalVolume.value - top10Vol)] }
  })

  const customerLoyaltyData = computed(() => {
    return Object.entries(workerResults.value.customers || {}).map(([nif, info]: [string, any]) => ({
      nif, name: info.name, volume: info.volume, frequency: info.trips,
      average: info.volume / info.trips, firstPurchase: info.firstDate, lastPurchase: info.lastDate
    }))
  })

  const plantPerformanceData = computed(() => workerResults.value.techByPlant || [])
  const technicalKPIsByPlant = plantPerformanceData // Alias para compatibilidad con la vista

  const technicalHeatmapData = computed(() => {
    const data = workerResults.value.rawByDay || {}
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    // Agrupar por semana a partir de rawByDay
    const weekGroups: Record<string, number[]> = {}
    
    Object.entries(data).forEach(([isoDate, volume]: [string, any]) => {
      const date = new Date(isoDate)
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      const weekLabel = `Sem. ${weekNo} (${d.getUTCFullYear()})`
      const dayIdx = (date.getDay() + 6) % 7

      if (!weekGroups[weekLabel]) weekGroups[weekLabel] = [0, 0, 0, 0, 0, 0, 0]
      weekGroups[weekLabel]![dayIdx] = (weekGroups[weekLabel]![dayIdx] || 0) + volume
    })

    const sortedWeeks = Object.keys(weekGroups).sort() // Aproximación simple
    return {
      x: days,
      y: sortedWeeks,
      z: sortedWeeks.map(w => weekGroups[w]!)
    }
  })

  const technicalKPIs = computed(() => ({
    avgPerTrip: totalVolume.value / (workerResults.value.filteredCount || 1),
    totalArticles: 0, // Placeholder
    topArticle: '---',
    bestPlant: Object.entries(volumeByPlanta.value).sort((a:any, b:any) => b[1] - a[1])[0]?.[0] || '---',
    maxTimeToSite: Math.max(...(workerResults.value.techByPlant || []).map((p: any) => p.maxTimeToSite), 0),
    maxUnloadingTime: Math.max(...(workerResults.value.techByPlant || []).map((p: any) => p.maxUnloadingTime), 0),
    lateUnloadingsCount: (workerResults.value.techByPlant || []).reduce((acc: number, p: any) => acc + p.lateUnloadings, 0)
  }))

  const communityPlotlyData = computed(() => {
    const data = volumeByCommunity.value
    return [{
      type: 'pie', labels: Object.keys(data), values: Object.values(data), hole: 0.4,
      marker: { colors: twColors['chart-greens'], line: { width: 2, color: twColors['brand-gray'][0] } },
      textinfo: 'label+percent', hovertemplate: '<b>%{label}</b><br>Volumen: %{value:,.0f} m³<br>%{percent}<extra></extra>'
    }]
  })

  function setSales(sales: Sale[]) {
    rawSales.value = sales
  }

  function addSales(chunk: Sale[]) {
    rawSales.value = [...rawSales.value, ...chunk]
  }

  function setFilters(newFilters: Partial<SalesFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function removeFilterValue(key: keyof SalesFilters, value: string) {
    const current = filters.value[key]
    if (Array.isArray(current)) {
      filters.value[key] = current.filter(v => v !== value) as any
    }
  }

  return {
    rawSales, filters, totalVolume, volumeByPlanta, volumeByCommunity, communityPlotlyData, salesByDay, salesByMonth,
    maxSalesDay, selfConsumptionVolume, averageVolumeByPlanta, averageSalesByDay, averageSalesByMonth,
    uniqueNomenclaturesCount, averageCementContent, formulaTreemapData, formulaViolinData,
    volumeByTransportista, volumeByMatricula, topTransportista, topTruck, transportTreeMapData,
    uniqueClientsCount, volumeByCustomer, topClient, concentrationData,
    customerLoyaltyData, plantPerformanceData, technicalKPIs, pivotData, filterOptions,
    technicalKPIsByPlant, technicalHeatmapData, filteredSales, volumeVariation,
    top3ClientsInfo, top10ClientsInfo,
    isLoading, isExcelLoading, fileError, fileName, isCalculating, totalProcessedRecords, loadingStep, setSales, addSales, setFilters, removeFilterValue, triggerAnalysis, waitUntilAnalyzed,
    setFileError(error: string | null) { fileError.value = error },
    setFileName(name: string | null) { fileName.value = name; totalProcessedRecords.value = 0; isExcelLoading.value = false }
  }
})
