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

  const totalVolume = computed(() => {
    return filteredSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
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
    isLoading,
    setSales,
    setFilters
  }
})
