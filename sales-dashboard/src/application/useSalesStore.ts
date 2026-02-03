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

  const salesByDate = computed(() => {
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
    salesByDate,
    isLoading,
    setSales,
    setFilters
  }
})
