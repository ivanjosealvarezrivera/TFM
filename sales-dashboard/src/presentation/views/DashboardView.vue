<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <header class="bg-white p-8 rounded-2xl shadow-md mb-8 border-t-4 border-primary-green">
      <h1 class="text-3xl font-black text-gray-800 text-center">Panel de Análisis de Ventas de Hormigón</h1>
      <p class="text-center text-gray-500 mt-2 font-medium">Refactorización Profesional Clean Architecture</p>
    </header>

    <div class="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-700 mb-2">Archivo de Ventas (.xlsx)</label>
          <input 
            type="file" 
            accept=".xlsx" 
            @change="handleFileUpload"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-green file:text-white hover:file:bg-darker-green transition-all"
          >
        </div>
        <div v-if="salesStore.rawSales.length > 0" class="flex gap-4">
          <DatePicker v-model="dates" selectionMode="range" :manualInput="false" placeholder="Rango de Fechas" />
          <Button label="Limpiar Filtros" icon="pi pi-filter-slash" outlined @click="resetFilters" />
        </div>
      </div>
    </div>

    <div v-if="salesStore.isLoading" class="flex flex-col items-center justify-center p-20">
      <ProgressSpinner />
      <p class="mt-4 text-primary-green font-bold">Procesando datos...</p>
    </div>

    <div v-else-if="salesStore.rawSales.length > 0">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Volumen Total" 
          :value="salesStore.totalVolume.toLocaleString() + ' m³'" 
          icon="pi pi-chart-bar" 
          iconClass="text-brighter-green"
          :subtitle="salesStore.volumeVariation !== 0 ? `${salesStore.volumeVariation > 0 ? '+' : ''}${salesStore.volumeVariation.toFixed(1)}% vs mes anterior` : ''"
        />
        <KPICard title="Ventas Filtradas" :value="salesStore.filteredSales.length" icon="pi pi-ticket" iconClass="text-medium-dark-green" />
        <!-- Más KPIs según lógica MoM posterior -->
      </div>

      <Tabs value="0">
        <TabList>
          <Tab value="0">Análisis de Ventas</Tab>
          <Tab value="1">Transporte</Tab>
          <Tab value="2">Clientes</Tab>
          <Tab value="3">Análisis Técnico</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Volumen por Planta</h3>
                <BaseChartJS :config="plantaChartConfig" />
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Ventas en el Tiempo</h3>
                <BaseChartJS :config="timeChartConfig" />
              </div>
            </div>
          </TabPanel>
          <TabPanel value="1">
            <!-- Transporte Tab Content -->
          </TabPanel>
          <TabPanel value="2">
            <!-- Clientes Tab Content -->
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <div v-else class="text-center p-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
      <i class="pi pi-cloud-upload text-6xl text-gray-300 mb-4"></i>
      <h2 class="text-xl font-bold text-gray-400">Sube un archivo para comenzar el análisis</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSalesStore } from '../../application/useSalesStore'
import { ExcelService } from '../../infrastructure/services/ExcelService'
import type { ChartConfiguration } from 'chart.js'
import KPICard from '../components/KPICard.vue'
import BaseChartJS from '../components/BaseChartJS.vue'
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const salesStore = useSalesStore()
const dates = ref<Date[] | null>(null)

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    salesStore.isLoading = true
    try {
      const sales = await ExcelService.processFile(input.files[0])
      salesStore.setSales(sales)
      toast.add({ 
        severity: 'success', 
        summary: 'Éxito', 
        detail: `Se han cargado ${sales.length} registros correctamente`, 
        life: 3000 
      });
    } catch (error: any) {
      console.error(error)
      toast.add({ 
        severity: 'error', 
        summary: 'Error de Carga', 
        detail: error.message || 'Error desconocido al procesar el archivo', 
        life: 5000 
      });
    } finally {
      salesStore.isLoading = false
    }
  }
}

const resetFilters = () => {
  dates.value = null
  salesStore.setFilters({ startDate: null, endDate: null })
}

watch(dates, (newDates) => {
  if (newDates && newDates.length === 2 && newDates[0] && newDates[1]) {
    salesStore.setFilters({
      startDate: newDates[0].toISOString().split('T')[0],
      endDate: newDates[1].toISOString().split('T')[0]
    })
  } else if (!newDates) {
    salesStore.setFilters({ startDate: null, endDate: null })
  }
})

// Chart Configurations (Simplified using Store Getters)
const plantaChartConfig = computed<ChartConfiguration>(() => {
    return {
        type: 'bar',
        data: {
            labels: Object.keys(salesStore.volumeByPlanta),
            datasets: [{
                label: 'm³',
                data: Object.values(salesStore.volumeByPlanta),
                backgroundColor: '#4B7F61'
            }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false 
        }
    }
})

const timeChartConfig = computed<ChartConfiguration>(() => {
    return {
        type: 'line',
        data: {
            labels: salesStore.salesByDate.labels,
            datasets: [{
                label: 'Ventas Diarias',
                data: salesStore.salesByDate.values,
                borderColor: '#004730',
                tension: 0.1
            }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false 
        }
    }
})
</script>
