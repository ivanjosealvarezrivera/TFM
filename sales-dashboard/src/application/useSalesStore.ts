import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sale, SalesFilters } from '../core/entities/Sale'

export const useSalesStore = defineStore('sales', () => {
  const rawSales = ref<Sale[]>([])
  const isLoading = ref(false)
  
  const filters = ref<SalesFilters>({
    startDate: null,
    endDate: null,
    fabrica: null,
    fabricaPrefix: null,
    grupo: null,
    truck: null,
    transportista: null
  })

  const filteredSales = computed(() => {
    return rawSales.value.filter(sale => {
      if (filters.value.startDate && sale.fecha < filters.value.startDate) return false
      if (filters.value.endDate && sale.fecha > filters.value.endDate) return false
      if (filters.value.fabrica && sale.planta !== filters.value.fabrica) return false
      if (filters.value.fabricaPrefix && sale.comunidad !== filters.value.fabricaPrefix) return false
      if (filters.value.grupo && sale.grupo !== filters.value.grupo) return false
      if (filters.value.truck && sale.matricula !== filters.value.truck) return false
      if (filters.value.transportista && sale.nombreTransportista !== filters.value.transportista) return false
      return true
    })
  })

  const prevPeriodSales = computed(() => {
    if (!filters.value.startDate || !filters.value.endDate) return []
    
    const start = new Date(filters.value.startDate)
    const end = new Date(filters.value.endDate)
    start.setMonth(start.getMonth() - 1)
    end.setMonth(end.getMonth() - 1)
    
    const startStr = start.toISOString().split('T')[0] || ''
    const endStr = end.toISOString().split('T')[0] || ''

    return rawSales.value.filter(sale => {
      if (!startStr || !endStr) return false
      if (sale.fecha < startStr || sale.fecha > endStr) return false
      if (filters.value.fabrica && sale.planta !== filters.value.fabrica) return false
      if (filters.value.fabricaPrefix && sale.comunidad !== filters.value.fabricaPrefix) return false
      if (filters.value.grupo && sale.grupo !== filters.value.grupo) return false
      if (filters.value.truck && sale.matricula !== filters.value.truck) return false
      if (filters.value.transportista && sale.nombreTransportista !== filters.value.transportista) return false
      return true
    })
  })

  const totalVolume = computed(() => {
    return filteredSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  const prevTotalVolume = computed(() => {
    return prevPeriodSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  const volumeVariation = computed(() => {
    if (prevTotalVolume.value === 0) return 0
    return ((totalVolume.value - prevTotalVolume.value) / prevTotalVolume.value) * 100
  })

  const volumeByPlanta = computed(() => {
    return filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.planta] = (acc[sale.planta] || 0) + sale.cantidad
      return acc
    }, {})
  })

  const volumeByCommunity = computed(() => {
    return filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.comunidad] = (acc[sale.comunidad] || 0) + sale.cantidad
      return acc
    }, {})
  })

  const salesByDay = computed(() => {
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      const d = sale.fecha // Ya es YYYY-MM-DD
      acc[d] = (acc[d] || 0) + sale.cantidad
      return acc
    }, {})
    
    const sortedKeys = Object.keys(data).sort()
    return {
      labels: sortedKeys.map(k => {
        const [y, m, d] = k.split('-')
        return `${d}/${m}/${y}`
      }),
      values: sortedKeys.map(k => data[k] ?? 0)
    }
  })

  const salesByMonth = computed(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      const date = new Date(sale.fecha)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      acc[key] = (acc[key] || 0) + sale.cantidad
      return acc
    }, {})

    const sortedEntries = Object.entries(data).sort((a, b) => {
      const partsA = a[0].split(' ')
      const partsB = b[0].split(' ')
      const mA = partsA[0] || ''
      const yA = partsA[1] || '0'
      const mB = partsB[0] || ''
      const yB = partsB[1] || '0'
      
      const dateA = new Date(parseInt(yA), months.indexOf(mA))
      const dateB = new Date(parseInt(yB), months.indexOf(mB))
      return dateA.getTime() - dateB.getTime()
    })

    return {
      labels: sortedEntries.map(e => e[0]),
      values: sortedEntries.map(e => e[1])
    }
  })

  // Nuevos KPIs de Negocio
  const maxSalesDay = computed(() => {
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.fecha] = (acc[sale.fecha] || 0) + sale.cantidad
      return acc
    }, {})
    
    let maxDate = ''
    let maxValue = 0
    
    Object.entries(data).forEach(([date, value]) => {
      if (value > maxValue) {
        maxValue = value
        maxDate = date
      }
    })

    if (!maxDate) return null
    
    const [y, m, d] = maxDate.split('-')
    return {
      date: `${d}/${m}/${y}`,
      value: maxValue
    }
  })

  const selfConsumptionVolume = computed(() => {
    return filteredSales.value
      .filter(sale => sale.nombreCliente.includes('GENERAL DE HORMIGONES, S.A.'))
      .reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  // Cálculos de Medias para Gráficos
  const averageVolumeByPlanta = computed(() => {
    const values = Object.values(volumeByPlanta.value)
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByDay = computed(() => {
    const values = salesByDay.value.values
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByMonth = computed(() => {
    const values = salesByMonth.value.values
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  // Lógica de Tabla Dinámica (Pivot: Fecha vs Planta)
  const pivotData = computed(() => {
    const plants = Object.keys(volumeByPlanta.value).sort()
    const isoDates = Object.keys(filteredSales.value.reduce((acc: Record<string, boolean>, s) => {
      acc[s.fecha] = true
      return acc
    }, {})).sort()
    
    // Mapa de datos: [fecha_iso][planta] = volumen
    const dataMap = filteredSales.value.reduce((acc: Record<string, Record<string, number>>, sale) => {
      const date = sale.fecha
      if (!acc[date]) acc[date] = {}
      acc[date][sale.planta] = (acc[date][sale.planta] || 0) + sale.cantidad
      return acc
    }, {})

    // Generar filas
    const rows = isoDates.map(isoDate => {
      const [y, m, d] = isoDate.split('-')
      const formattedDate = `${d}/${m}/${y}`
      
      const row: Record<string, any> = { date: formattedDate }
      let rowTotal = 0
      
      plants.forEach(plant => {
        const value = dataMap[isoDate]?.[plant] || 0
        row[plant] = value
        rowTotal += value
      })
      
      row.total = rowTotal
      return row
    })

    // Totales por Planta (Fila final)
    const plantTotals: Record<string, number> = {}
    let grandTotal = 0
    plants.forEach(plant => {
      const total = rows.reduce((acc, row) => acc + (row[plant] || 0), 0)
      plantTotals[plant] = total
      grandTotal += total
    })

    return {
      columns: plants,
      rows,
      plantTotals,
      grandTotal
    }
  })

  function setSales(sales: Sale[]) {
    rawSales.value = sales
  }

  function setFilters(newFilters: Partial<SalesFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    rawSales,
    filters,
    filteredSales,
    totalVolume,
    prevTotalVolume,
    volumeVariation,
    volumeByPlanta,
    volumeByCommunity,
    salesByDay,
    salesByMonth,
    maxSalesDay,
    selfConsumptionVolume,
    averageVolumeByPlanta,
    averageSalesByDay,
    averageSalesByMonth,
    pivotData,
    isLoading,
    setSales,
    setFilters
  }
})
