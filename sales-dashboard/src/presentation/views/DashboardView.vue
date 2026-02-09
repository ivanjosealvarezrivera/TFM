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
          <DatePicker v-model="dates" selectionMode="range" :manualInput="false" placeholder="Rango de Fechas" dateFormat="dd/mm/yy" />
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
        <KPICard 
          title="Día Top Ventas" 
          :value="salesStore.maxSalesDay ? salesStore.maxSalesDay.value.toLocaleString() + ' m³' : '---'" 
          icon="pi pi-calendar-plus" 
          iconClass="text-pale-green"
          :subtitle="salesStore.maxSalesDay ? salesStore.maxSalesDay.date : ''"
        />
        <KPICard 
          title="Autoconsumo" 
          :value="salesStore.selfConsumptionVolume.toLocaleString() + ' m³'" 
          icon="pi pi-sync" 
          iconClass="text-primary-green"
          subtitle="Gral. Hormigones S.A."
        />
      </div>

      <Tabs value="0">
        <TabList>
          <Tab value="0">Análisis de Ventas</Tab>
          <Tab value="1">Análisis de Fórmulas</Tab>
          <Tab value="2">Análisis de Transporte</Tab>
          <Tab value="3">Análisis de Clientes</Tab>
          <Tab value="4">Análisis Técnico</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <!-- 1. Ventas por Meses -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Ventas por Meses</h3>
                <div class="h-96">
                  <BaseChartJS :config="monthChartConfig" />
                </div>
              </div>
              <!-- 2. Ventas por Días -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Ventas por Días</h3>
                <div class="h-96">
                  <BaseChartJS :config="dayChartConfig" />
                </div>
              </div>
              <!-- 3. Ventas por Comunidad Autónoma -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Ventas por Comunidad Autónoma</h3>
                <div class="h-80">
                  <BasePlotly :data="(salesStore.communityPlotlyData as any)" :layout="communityPlotlyLayout" />
                </div>
              </div>
              <!-- 4. Ventas por Planta -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Ventas por Planta</h3>
                <div class="h-96">
                  <BaseChartJS :config="plantaChartConfig" />
                </div>
              </div>
            </div>
            <div class="mt-8">
              <PivotSalesTable :data="salesStore.pivotData" />
            </div>
          </TabPanel>

          <TabPanel value="1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-8">
              <KPICard 
                title="Nomenclaturas Únicas" 
                :value="salesStore.uniqueNomenclaturesCount" 
                icon="pi pi-tag" 
                iconClass="text-primary-green" 
              />
              <KPICard 
                title="Medio Cemento" 
                :value="salesStore.averageCementContent.toFixed(1) + ' kg/m³'" 
                icon="pi pi-filter" 
                iconClass="text-darker-green" 
              />
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Volumen por Nomenclatura y Resistencia</h3>
                <p class="text-sm text-gray-500 mb-4">Distribución del volumen por tipo de producto. Haga clic para filtrar.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(salesStore.formulaTreemapData as any)" :layout="treemapLayout" />
                </div>
              </div>
              
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Contenido Cemento Real por Nomenclatura</h3>
                <p class="text-sm text-gray-500 mb-4">Distribución del contenido de cemento real para cada nomenclatura.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(salesStore.formulaViolinData as any)" :layout="violinLayout" />
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-8">
              <KPICard 
                title="Volumen Medio / Viaje" 
                :value="salesStore.technicalKPIs.avgPerTrip.toFixed(2) + ' m³'" 
                icon="pi pi-truck" 
                iconClass="text-blue-600" 
                subtitle="Eficiencia promedio de carga"
              />
              <KPICard 
                title="Top Transportista" 
                :value="salesStore.topTransportista ? salesStore.topTransportista.name : '---'" 
                icon="pi pi-truck" 
                iconClass="text-medium-dark-green" 
                :subtitle="salesStore.topTransportista ? salesStore.topTransportista.volume.toLocaleString() + ' m³' : ''"
              />
              <KPICard 
                title="Top Camión" 
                :value="salesStore.topTruck ? salesStore.topTruck.matricula : '---'" 
                icon="pi pi-id-card" 
                iconClass="text-pale-green" 
                :subtitle="salesStore.topTruck ? salesStore.topTruck.volume.toLocaleString() + ' m³' : ''"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Gráfico de Transportistas -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Volumen por Transportista</h3>
                <div class="overflow-y-auto max-h-[600px] border border-gray-50 rounded-xl">
                  <div :style="{ height: transportistaChartHeight }">
                    <BaseChartJS :config="transportistaChartConfig" />
                  </div>
                </div>
              </div>

              <!-- Gráfico de Matrículas -->
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Volumen por Matrícula</h3>
                <div class="overflow-y-auto max-h-[600px] border border-gray-50 rounded-xl">
                  <div :style="{ height: matriculaChartHeight }">
                    <BaseChartJS :config="matriculaChartConfig" />
                  </div>
                </div>
              </div>

              <!-- Treemap de Transporte -->
              <div class="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 class="text-lg font-bold text-gray-700 m-6 mb-4">Análisis Transportista > Matrícula</h3>
                <div class="w-full h-[850px]">
                  <BasePlotly 
                    :data="(salesStore.transportTreeMapData as any)" 
                    :layout="(treemapLayout as any)" 
                  />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="3">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-8">
              <KPICard 
                title="Clientes Únicos" 
                :value="salesStore.uniqueClientsCount" 
                icon="pi pi-users" 
                iconClass="text-primary-green" 
              />
              <KPICard 
                title="Volumen Top 1 Cliente" 
                :value="salesStore.topClient.volume.toLocaleString() + ' m³'" 
                icon="pi pi-star-fill" 
                iconClass="text-medium-dark-green" 
                :subtitle="salesStore.topClient.name"
              />
              <KPICard 
                title="Volumen Top 3 Clientes" 
                :value="salesStore.top3ClientsInfo.volume.toLocaleString() + ' m³'" 
                icon="pi pi-chart-line" 
                iconClass="text-pale-green" 
                :subtitle="salesStore.top3ClientsInfo.names"
              />
              <KPICard 
                title="Volumen Top 10 Clientes" 
                :value="salesStore.top10ClientsInfo.volume.toLocaleString() + ' m³'" 
                icon="pi pi-list" 
                iconClass="text-darker-green" 
                :subtitle="salesStore.top10ClientsInfo.names"
              />
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Concentración de Cartera (Top 10 vs Otros)</h3>
                <p class="text-sm text-gray-500 mb-6">Visualice la dependencia de los clientes principales frente al resto de la cartera.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(concentrationChartData as any)" :layout="(concentrationLayout as any)" />
                </div>
              </div>

              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Matriz de Fidelización (Frecuencia vs Volumen)</h3>
                <p class="text-sm text-gray-500 mb-6">Clasificación por hábito de compra. El tamaño de la burbuja es el promedio m³/pedido.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(bubbleChartData as any)" :layout="(bubbleLayout as any)" />
                </div>
              </div>
            </div>

            <!-- Tabla de Detalle -->
            <div class="mt-8">
              <CustomerSalesTable :data="salesStore.customerLoyaltyData" />
            </div>
          </TabPanel>

          <TabPanel value="4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-8">
              <KPICard 
                title="Tiempo Máximo a Obra" 
                :value="salesStore.technicalKPIs.maxTimeToSite.toFixed(0) + ' min'" 
                icon="pi pi-map-marker" 
                iconClass="text-orange-600" 
                subtitle="Máximo tiempo de transporte"
              />
              <KPICard 
                title="Tiempo Máximo Descarga" 
                :value="salesStore.technicalKPIs.maxUnloadingTime.toFixed(0) + ' min'" 
                icon="pi pi-clock" 
                iconClass="text-blue-600" 
                subtitle="Máximo tiempo en obra"
              />
              <KPICard 
                title="Nº Descargas Tardías" 
                :value="salesStore.technicalKPIs.lateUnloadingsCount.toLocaleString()" 
                icon="pi pi-exclamation-triangle" 
                iconClass="text-red-600" 
                subtitle="Exceso sobre límite de uso"
              />
            </div>

            <div class="grid grid-cols-1 gap-6 mb-8">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Eficiencia Logística por Planta (Tiempo Viaje vs Descarga)</h3>
                <p class="text-sm text-gray-500 mb-6">El tamaño de la burbuja indica el número de descargas tardías. Cuanto más arriba y a la derecha, mayores son los tiempos máximos.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(technicalBubbleChartData as any)" :layout="(technicalBubbleLayout as any)" />
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-700 mb-4">Evolución Semanal de la Demanda (Heatmap)</h3>
              <p class="text-sm text-gray-500 mb-6">Visualización de la intensidad de carga por día y semana del año.</p>
              <div :style="{ height: heatmapChartHeight }">
                <BasePlotly :data="(heatmapChartData as any)" :layout="(heatmapLayout as any)" />
              </div>
            </div>
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
import KPICard from '../components/KPICard.vue';
import CustomerSalesTable from '../components/CustomerSalesTable.vue';
import BaseChartJS from '../components/BaseChartJS.vue'
import BasePlotly from '../components/BasePlotly.vue'
import PivotSalesTable from '../components/PivotSalesTable.vue'
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

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

watch(dates, (newDates) => {
  if (newDates && newDates.length === 2 && newDates[0] && newDates[1]) {
    salesStore.setFilters({
      startDate: formatLocalDate(newDates[0]),
      endDate: formatLocalDate(newDates[1])
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
            datasets: [
                {
                    label: 'm³',
                    data: Object.values(salesStore.volumeByPlanta),
                    backgroundColor: '#4B7F61'
                },
                {
                    label: `Media (${salesStore.averageVolumeByPlanta.toFixed(1)} m³)`,
                    data: new Array(Object.keys(salesStore.volumeByPlanta).length).fill(salesStore.averageVolumeByPlanta),
                    type: 'line',
                    borderColor: '#D42E12',
                    borderDash: [5, 5],
                    pointStyle: false,
                    fill: false
                }
            ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false 
        }
    }
})

const dayChartConfig = computed<ChartConfiguration>(() => {
    return {
        type: 'line',
        data: {
            labels: salesStore.salesByDay.labels,
            datasets: [
                {
                    label: 'Ventas Diarias',
                    data: salesStore.salesByDay.values,
                    borderColor: '#004730',
                    tension: 0.1
                },
                {
                    label: `Media Diaria (${salesStore.averageSalesByDay.toFixed(1)} m³)`,
                    data: new Array(salesStore.salesByDay.labels.length).fill(salesStore.averageSalesByDay),
                    borderColor: '#D42E12',
                    borderDash: [5, 5],
                    pointStyle: false,
                    fill: false
                }
            ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false 
        }
    }
})

const monthChartConfig = computed<ChartConfiguration>(() => {
    return {
        type: 'bar',
        data: {
            labels: salesStore.salesByMonth.labels,
            datasets: [
                {
                    label: 'Volumen Mensual (m³)',
                    data: salesStore.salesByMonth.values,
                    backgroundColor: '#1A664B'
                },
                {
                    label: `Media Mensual (${salesStore.averageSalesByMonth.toFixed(1)} m³)`,
                    data: new Array(salesStore.salesByMonth.labels.length).fill(salesStore.averageSalesByMonth),
                    type: 'line',
                    borderColor: '#D42E12',
                    borderDash: [5, 5],
                    pointStyle: false,
                    fill: false
                }
            ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false 
        }
    }
})



const transportistaChartConfig = computed<ChartConfiguration>(() => {
    const data = salesStore.volumeByTransportista;
    return {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'm³ Facturados',
                data: Object.values(data).map((v: any) => v.volume),
                backgroundColor: '#1A664B',
                barThickness: 12
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = (context.parsed?.x ?? 0) as number;
                            const stats = data[context.label] as any;
                            if (stats) {
                                return [
                                    `${label}: ${value.toLocaleString()} m³`,
                                    `Viajes: ${stats.trips}`,
                                    `Media/Viaje: ${stats.avgVolume.toFixed(2)} m³`,
                                    `Matrículas: ${stats.uniqueTrucks}`
                                ];
                            }
                            return `${label}: ${value.toLocaleString()} m³`;
                        }
                    }
                }
            }
        }
    }
})

const matriculaChartConfig = computed<ChartConfiguration>(() => {
    const data = salesStore.volumeByMatricula;
    return {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'm³ Facturados',
                data: Object.values(data).map((v: any) => v.volume),
                backgroundColor: '#4B7F61',
                barThickness: 12
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = (context.parsed?.x ?? 0) as number;
                            const stats = data[context.label] as any;
                            if (stats) {
                                return [
                                    `${label}: ${value.toLocaleString()} m³`,
                                    `Viajes: ${stats.trips}`,
                                    `Media/Viaje: ${stats.avgVolume.toFixed(2)} m³`
                                ];
                            }
                            return `${label}: ${value.toLocaleString()} m³`;
                        }
                    }
                }
            }
        }
    }
})

const transportistaChartHeight = computed(() => {
    const count = Object.keys(salesStore.volumeByTransportista).length;
    return `${Math.max(400, count * 20)}px`;
})

const matriculaChartHeight = computed(() => {
    const count = Object.keys(salesStore.volumeByMatricula).length;
    return `${Math.max(400, count * 20)}px`;
})

const heatmapChartHeight = computed(() => {
    const count = (salesStore.technicalHeatmapData.y || []).length;
    return `${Math.max(600, count * 25)}px`;
})


const concentrationChartData = computed(() => {
  const data = salesStore.concentrationData;
  return [
    {
      labels: data.labels,
      values: data.values,
      type: 'pie',
      hole: 0.5,
      marker: {
        colors: ['#004730', '#4B7F61']
      },
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
      insidetextorientation: 'radial'
    }
  ];
});

const concentrationLayout = {
  autosize: true,
  margin: { t: 40, l: 20, r: 20, b: 40 },
  showlegend: true,
  legend: { orientation: 'h' as any, y: -0.1, x: 0.5, xanchor: 'center' as any },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif' }
}

const bubbleChartData = computed(() => {
  const data = salesStore.customerLoyaltyData;
  return [
    {
      x: data.map(d => d.frequency),
      y: data.map(d => d.volume),
      text: data.map(d => `<b>${d.name}</b><br>Pedidos: ${d.frequency}<br>Volumen: ${d.volume.toLocaleString()} m³<br>Media: ${d.average.toFixed(2)} m³/pedido`),
      mode: 'markers',
      marker: {
        size: data.map(d => d.average),
        sizemode: 'area',
        sizeref: 2.0 * Math.max(...data.map(d => d.average)) / (40 ** 2),
        sizemin: 4,
        color: data.map(d => d.volume),
        colorscale: 'Greens',
        showscale: true,
        reversescale: true,
        opacity: 0.7,
        line: { width: 1, color: '#fff' }
      }
    }
  ];
});

const bubbleLayout = {
  autosize: true,
  margin: { t: 40, l: 60, r: 20, b: 60 },
  hovermode: 'closest' as any,
  xaxis: {
    title: { text: 'Frecuencia (Número de Pedidos)' },
    gridcolor: '#f0f0f0',
    zeroline: false
  },
  yaxis: {
    title: { text: 'Volumen Total (m³)' },
    gridcolor: '#f0f0f0',
    zeroline: false
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(249, 250, 251, 0.5)',
  font: { family: 'Inter, sans-serif' }
}

const heatmapChartData = computed(() => {
  const data = salesStore.technicalHeatmapData;
  return [
    {
      x: data.x,
      y: data.y,
      z: data.z,
      type: 'heatmap',
      colorscale: 'Greens',
      reversescale: true,
      showscale: true,
      hoverongaps: false,
      text: (data.z || []).map((row, i) => 
        (row || []).map((val, j) => 
          `<b>Día:</b> ${data.x[j]}<br><b>Semana:</b> ${data.y[i]}<br><b>Volumen:</b> ${val.toLocaleString()} m³`
        )
      ),
      hoverinfo: 'text'
    }
  ];
});

const technicalBubbleChartData = computed(() => {
  const data = salesStore.technicalKPIsByPlant;
  return [
    {
      x: data.map(d => d.maxTimeToSite),
      y: data.map(d => d.maxUnloadingTime),
      text: data.map(d => `<b>Planta: ${d.name}</b><br>T. Máx Viaje: ${d.maxTimeToSite.toFixed(0)} min<br>T. Máx Descarga: ${d.maxUnloadingTime.toFixed(0)} min<br>Descargas Tardías: ${d.lateUnloadings}`),
      mode: 'markers',
      marker: {
        size: data.map(d => d.lateUnloadings),
        sizemode: 'area',
        sizeref: 2.0 * Math.max(...data.map(d => d.lateUnloadings), 1) / (60 ** 2),
        sizemin: 10,
        color: data.map(d => d.lateUnloadings),
        colorscale: 'Greens',
        showscale: true,
        reversescale: true,
        opacity: 0.7,
        line: { width: 1, color: '#fff' }
      }
    }
  ];
});

const technicalBubbleLayout = {
  autosize: true,
  margin: { t: 40, l: 60, r: 20, b: 60 },
  hovermode: 'closest' as any,
  xaxis: {
    title: { text: 'T. Máximo a Obra (min)' },
    gridcolor: '#f0f0f0',
    zeroline: false
  },
  yaxis: {
    title: { text: 'T. Máximo Descarga (min)' },
    gridcolor: '#f0f0f0',
    zeroline: false
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(249, 250, 251, 0.5)',
  font: { family: 'Inter, sans-serif' }
}

const heatmapLayout = {
  autosize: true,
  margin: { t: 60, l: 120, r: 20, b: 60 },
  xaxis: {
    title: { text: 'Día de la Semana', standoff: 20 },
    side: 'top' as any,
    fixedrange: true
  },
  yaxis: {
    title: { text: 'Semanas', standoff: 20 },
    autorange: 'reversed',
    fixedrange: true,
    dtick: 1
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif' }
}

const treemapLayout = {
  autosize: true,
  margin: { t: 30, l: 0, r: 0, b: 0 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { 
    family: 'Inter, sans-serif',
    size: 12,
    color: '#333'
  },
  hoverlabel: {
    bgcolor: '#FFF',
    font: { family: 'Inter, sans-serif', size: 14 }
  }
}

const communityPlotlyLayout = {
  autosize: true,
  margin: { t: 40, l: 40, r: 40, b: 40 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif' },
  polar: {
    bgcolor: 'rgba(249, 250, 251, 0.5)',
    angularaxis: {
      gridcolor: '#eee',
      linecolor: '#eee'
    },
    radialaxis: {
      gridcolor: '#eee',
      linecolor: '#eee',
      side: 'counterclockwise' as any
    }
  },
  showlegend: false,
}

const violinLayout = {
  margin: { t: 30, l: 60, r: 30, b: 80 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  yaxis: {
    title: { text: 'Cemento (kg/m³)' },
    zeroline: false,
    gridcolor: '#f0f0f0'
  },
  xaxis: {
    tickangle: 45
  },
  showlegend: false
}
</script>
