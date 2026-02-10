import type { Sale, SalesFilters } from '../../core/entities/Sale'

// Optimizamos enviando solo los datos necesarios al worker
interface WorkerInput {
  sales: Sale[]
  filters: SalesFilters
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { sales, filters } = event.data
  
  // 1. Filtrado
  const filtered = sales.filter(sale => {
    if (filters.startDate && sale.fecha < filters.startDate) return false
    if (filters.endDate && sale.fecha > filters.endDate) return false
    if (filters.fabricas?.length && !filters.fabricas.includes(sale.planta)) return false
    if (filters.comunidades?.length && !filters.comunidades.includes(sale.comunidad)) return false
    if (filters.nomenclaturas?.length && !filters.nomenclaturas.includes(sale.nomenclatura)) return false
    if (filters.transportistas?.length && !filters.transportistas.includes(sale.nombreTransportista)) return false
    if (filters.matriculas?.length && !filters.matriculas.includes(sale.matricula)) return false
    if (filters.clientes?.length && !filters.clientes.includes(sale.cliente)) return false
    return true
  })

  // 2. Agregaciones
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const byDay: Record<string, number> = {}
  const byDayPlant: Record<string, Record<string, number>> = {}
  const byMonth: Record<string, number> = {}
  const byPlanta: Record<string, number> = {}
  const byCommunity: Record<string, number> = {}
  const byTransportista: Record<string, { volume: number; trips: number; trucks: Set<string>; trucksDetail: Record<string, number> }> = {}
  const byMatricula: Record<string, { volume: number; trips: number }> = {}
  const byCustomer: Record<string, { volume: number; trips: number; name: string; firstDate: string; lastDate: string }> = {}
  const byNomenclature: Record<string, { volume: number; resistance: Set<string>; cementDistribution: number[] }> = {}
  const techByPlant: Record<string, { maxTimeToSite: number; maxUnloadingTime: number; lateUnloadings: number }> = {}
  
  let totalVol = 0
  let selfVol = 0
  let totalCem = 0
  let validCemCount = 0
  let maxDayValue = 0
  let maxDayDate = ''

  filtered.forEach(sale => {
    totalVol += sale.cantidad
    
    // Planta & Comunidad
    byPlanta[sale.planta] = (byPlanta[sale.planta] || 0) + sale.cantidad
    byCommunity[sale.comunidad] = (byCommunity[sale.comunidad] || 0) + sale.cantidad
    
    // Día & Matriz Pivot
    byDay[sale.fecha] = (byDay[sale.fecha] || 0) + sale.cantidad
    if (!byDayPlant[sale.fecha]) byDayPlant[sale.fecha] = {}
    byDayPlant[sale.fecha]![sale.planta] = (byDayPlant[sale.fecha]![sale.planta] || 0) + sale.cantidad

    if (byDay[sale.fecha]! > maxDayValue) {
      maxDayValue = byDay[sale.fecha]!
      maxDayDate = sale.fecha
    }
    
    // Mes
    const year = sale.fecha.substring(0, 4)
    const monthIdx = parseInt(sale.fecha.substring(5, 7)) - 1
    const monthKey = `${months[monthIdx]} ${year}`
    byMonth[monthKey] = (byMonth[monthKey] || 0) + sale.cantidad

    // Fórmulas & Violín
    if (!byNomenclature[sale.nomenclatura]) {
      byNomenclature[sale.nomenclatura] = { volume: 0, resistance: new Set(), cementDistribution: [] }
    }
    const nomEntry = byNomenclature[sale.nomenclatura]!
    nomEntry.volume += sale.cantidad
    nomEntry.resistance.add(sale.grupo.split('-').slice(1).join('-') || 'ND')
    if (sale.contenidoCementoReal && sale.contenidoCementoReal > 0) {
      nomEntry.cementDistribution.push(sale.contenidoCementoReal)
      totalCem += sale.contenidoCementoReal
      validCemCount++
    }

    // Auto-consumo
    if (sale.nombreCliente.includes('GENERAL DE HORMIGONES, S.A.')) {
      selfVol += sale.cantidad
    }

    // Transporte & Sunburst
    if (!byTransportista[sale.nombreTransportista]) {
      byTransportista[sale.nombreTransportista] = { volume: 0, trips: 0, trucks: new Set(), trucksDetail: {} }
    }
    const tEntry = byTransportista[sale.nombreTransportista]!
    tEntry.volume += sale.cantidad
    tEntry.trips++
    tEntry.trucks.add(sale.matricula)
    tEntry.trucksDetail[sale.matricula] = (tEntry.trucksDetail[sale.matricula] || 0) + sale.cantidad

    if (!byMatricula[sale.matricula]) {
      byMatricula[sale.matricula] = { volume: 0, trips: 0 }
    }
    const mEntry = byMatricula[sale.matricula]!
    mEntry.volume += sale.cantidad
    mEntry.trips++

    // Clientes
    if (!byCustomer[sale.cliente]) {
      byCustomer[sale.cliente] = { volume: 0, trips: 0, name: sale.nombreCliente, firstDate: sale.fecha, lastDate: sale.fecha }
    }
    const cEntry = byCustomer[sale.cliente]!
    cEntry.volume += sale.cantidad
    cEntry.trips++
    if (sale.fecha < cEntry.firstDate) cEntry.firstDate = sale.fecha
    if (sale.fecha > cEntry.lastDate) cEntry.lastDate = sale.fecha

    // Técnico por Planta
    if (!techByPlant[sale.planta]) {
      techByPlant[sale.planta] = { maxTimeToSite: 0, maxUnloadingTime: 0, lateUnloadings: 0 }
    }
    const techEntry = techByPlant[sale.planta]!
    if (sale.tiempoViaje && sale.tiempoViaje > techEntry.maxTimeToSite) techEntry.maxTimeToSite = sale.tiempoViaje
    if (sale.tiempoDescarga && sale.tiempoDescarga > techEntry.maxUnloadingTime) techEntry.maxUnloadingTime = sale.tiempoDescarga
    if (sale.descargaTardia) techEntry.lateUnloadings++
  })

  // 3. Formateo de resultados para serialización (PostMessage no soporta Set)
  const transportData: Record<string, any> = {}
  Object.entries(byTransportista).forEach(([k, v]) => {
    transportData[k] = { ...v, trucks: Array.from(v.trucks) }
  })

  const nomenclatureData: Record<string, any> = {}
  Object.entries(byNomenclature).forEach(([k, v]) => {
    nomenclatureData[k] = { ...v, resistance: Array.from(v.resistance) }
  })

  const sortedDays = Object.keys(byDay).sort()
  const sortedMonths = Object.entries(byMonth).sort((a, b) => {
    const partsA = a[0].split(' ')
    const partsB = b[0].split(' ')
    const dateA = new Date(parseInt(partsA[1]!), months.indexOf(partsA[0]!)).getTime()
    const dateB = new Date(parseInt(partsB[1]!), months.indexOf(partsB[0]!)).getTime()
    return dateA - dateB
  })

  let maxDayLabel = null
  if (maxDayDate) {
    const [y, m, d] = maxDayDate.split('-')
    maxDayLabel = { date: `${d}/${m}/${y}`, value: maxDayValue }
  }

  try {
    self.postMessage({
      totalVolume: totalVol,
      volumeByPlanta: byPlanta,
      volumeByCommunity: byCommunity,
      byDay: {
        labels: sortedDays.map(k => {
          const [y, m, d] = k.split('-')
          return `${d}/${m}/${y}`
        }),
        values: sortedDays.map(k => byDay[k]!)
      },
      byMonth: {
        labels: sortedMonths.map(e => e[0]),
        values: sortedMonths.map(e => e[1]!)
      },
      selfConsumptionVolume: selfVol,
      averageCement: validCemCount > 0 ? totalCem / validCemCount : 0,
      uniqueNomenclaturesCount: Object.keys(byNomenclature).length,
      maxSalesDay: maxDayLabel,
      transportistas: transportData,
      matriculas: byMatricula,
      customers: byCustomer,
      nomenclatures: nomenclatureData,
      techByPlant: Object.entries(techByPlant).map(([name, info]) => ({ name, ...info })),
      filteredCount: filtered.length,
      rawByCustomer: byCustomer,
      rawByMatricula: byMatricula,
      rawByTransportista: transportData,
      rawByNomenclature: nomenclatureData,
      rawByDay: byDay,
      rawByDayPlant: byDayPlant, // Matriz Pivot
      techHeatmap: techByPlant
    })
  } catch (err) {
    console.error("Worker postMessage error:", err)
    // Enviar algo mínimo para evitar bloqueo de UI
    self.postMessage({ error: "DataCloneError", detail: String(err) })
  }
}
