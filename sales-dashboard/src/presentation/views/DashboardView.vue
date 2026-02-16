<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <header class="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md mb-8 border-t-4 border-primary-green flex justify-between items-center transition-colors duration-300">
      <div class="flex-1 text-center">
        <h1 class="text-3xl font-black text-gray-800 dark:text-gray-100 leading-tight">Panel de Análisis de Ventas de Hormigón</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2 font-medium italic">Inteligencia de Negocio y Control de Gestión Operativa</p>
      </div>
      <Button 
        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" 
        @click="toggleDarkMode" 
        rounded 
        text 
        severity="secondary"
        class="ml-4"
        v-tooltip.bottom="'Cambiar tema'"
      />
    </header>

    <!-- Indicador de Carga (Worker) -->
    <div v-if="salesStore.isCalculating" class="fixed top-0 left-0 w-full h-1 z-50 overflow-hidden bg-transparent">
      <div class="h-full bg-primary-green animate-progress-glow"></div>
    </div>

    <div v-if="salesStore.rawSales.length > 0" class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 dark:border-gray-800 transition-colors duration-300 relative">
      <div v-if="salesStore.isCalculating || salesStore.isExcelLoading" class="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center p-4 transition-all cursor-wait shadow-inner">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-primary-green/20 flex flex-col items-center gap-4 animate-fadein max-w-md w-full">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 border-4 border-primary-green/10 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div class="flex flex-col items-center text-center">
            <span class="text-primary-green text-sm font-black uppercase tracking-widest mb-1">
              {{ salesStore.isCalculating ? (salesStore.isExcelLoading ? salesStore.loadingStep : 'Analizando datos...') : salesStore.loadingStep }}
            </span>
            <span v-if="salesStore.totalProcessedRecords > 0" class="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full shadow-sm mt-2">
              {{ formatNum(salesStore.totalProcessedRecords) }} registros cargados
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1">
          <div v-if="salesStore.fileName" class="flex items-center gap-2 mb-2 px-1 animate-fadein">
            <div class="w-1.5 h-1.5 rounded-full bg-primary-green animate-pulse"></div>
            <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Fichero actual: 
              <span class="text-primary-green dark:text-brighter-green ml-1">{{ salesStore.fileName }}</span>
            </span>
          </div>
          <FileDropZone 
            compact 
            :error="salesStore.fileError" 
            :missingCols="missingCols"
            @file-selected="onFileSelected" 
          />
        </div>
        <div v-if="salesStore.rawSales.length > 0" class="flex flex-col gap-3 min-w-[380px]">
          <div class="flex justify-between items-center">
            <label class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Filtrar por periodo
            </label>
            <div class="flex gap-1.5">
              <button 
                @click="setRange('thisMonth')" 
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-green hover:text-white transition-colors uppercase tracking-tighter"
                v-tooltip.top="'Este Mes'"
              >Mes</button>
              <button 
                @click="setRange('lastMonth')" 
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-green hover:text-white transition-colors uppercase tracking-tighter"
                v-tooltip.top="'Mes Anterior Completo'"
              >Mes Ant.</button>
              <button 
                @click="setRange('lastQuarter')" 
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-green hover:text-white transition-colors uppercase tracking-tighter"
                v-tooltip.top="'Últimos 3 meses'"
              >Tri.</button>
              <button 
                @click="setRange('thisYear')" 
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-green hover:text-white transition-colors uppercase tracking-tighter"
                v-tooltip.top="'Este Año'"
              >Año</button>
              <button 
                @click="setRange('lastYear')" 
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-green hover:text-white transition-colors uppercase tracking-tighter"
                v-tooltip.top="'Año Pasado'"
              >Año Ant.</button>
            </div>
          </div>
          <div class="flex gap-2">
            <DatePicker 
              v-model="dates" 
              selectionMode="range" 
              :manualInput="false" 
              placeholder="Elegir inicio y fin" 
              dateFormat="dd/mm/yy" 
              showIcon 
              iconDisplay="input"
              :numberOfMonths="2"
              hideOnRangeSelection
              class="flex-1"
              v-tooltip.top="'Haz clic en el primer día y luego en el último para definir el rango'"
            />
            <Button 
              icon="pi pi-filter-slash" 
              outlined 
              @click="resetFilters" 
              v-tooltip.top="'Borrar filtro de fechas'"
              :disabled="!dates"
            />
            <Button 
              :icon="showFilters ? 'pi pi-chevron-up' : 'pi pi-filter'" 
              :label="activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : 'Filtros Avanzados'"
              :outlined="!showFilters"
              :severity="activeFiltersCount > 0 ? 'success' : 'secondary'"
              @click="toggleFilters" 
              v-tooltip.top="'Más opciones de filtrado'"
            />
          </div>
          <div class="flex justify-between items-center -mt-1">
            <span v-if="dates && dates[0] && !dates[1]" class="text-[10px] font-bold text-primary-green animate-pulse">Selecciona la segunda fecha...</span>
            <span v-else-if="dates && dates[1]" class="text-[10px] font-bold text-primary-green">Rango activo</span>
            <span v-else class="text-[10px] font-medium text-gray-400">Sin filtro temporal</span>
          </div>
        </div>
      </div>

      <!-- Panel de Filtros Avanzados -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="transform -translate-y-4 opacity-0" 
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="showFilters" class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Plantas</label>
              <MultiSelect 
                v-model="salesStore.filters.fabricas" 
                :options="salesStore.filterOptions.fabricas" 
                placeholder="Todas las plantas" 
                :maxSelectedLabels="2"
                filter
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Comunidades</label>
              <MultiSelect 
                v-model="salesStore.filters.comunidades" 
                :options="salesStore.filterOptions.comunidades" 
                placeholder="Todas las comunidades" 
                :maxSelectedLabels="2"
                filter
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Nomenclaturas</label>
              <MultiSelect 
                v-model="salesStore.filters.nomenclaturas" 
                :options="salesStore.filterOptions.nomenclaturas" 
                placeholder="Todas" 
                :maxSelectedLabels="1"
                filter
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Transportistas</label>
              <MultiSelect 
                v-model="salesStore.filters.transportistas" 
                :options="salesStore.filterOptions.transportistas" 
                placeholder="Todos" 
                :maxSelectedLabels="1"
                filter
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Matrículas</label>
              <MultiSelect 
                v-model="salesStore.filters.matriculas" 
                :options="salesStore.filterOptions.matriculas" 
                placeholder="Todas" 
                :maxSelectedLabels="1"
                filter
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Clientes</label>
              <MultiSelect 
                v-model="salesStore.filters.clientes" 
                :options="salesStore.filterOptions.clientes" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Todos los clientes" 
                :maxSelectedLabels="1"
                filter
                class="w-full"
              />
            </div>
          </div>
        </div>
      </transition>

      <!-- Barra de Chips de Filtros Activos -->
      <div v-if="activeFiltersCount > 0" class="mt-4 flex flex-wrap gap-2 animate-fadein">
        <template v-for="(vals, key) in salesStore.filters" :key="key">
          <template v-if="Array.isArray(vals) && vals?.length">
            <Chip 
              v-for="val in vals" 
              :key="val" 
              :label="key === 'clientes' ? (salesStore.filterOptions.clientes.find(c => c.value === val)?.label || val) : val" 
              removable 
              @remove="salesStore.removeFilterValue(key as any, val)"
              class="!bg-primary-green/10 !text-primary-green !border-primary-green/20 dark:!bg-brighter-green/20 dark:!text-brighter-green dark:!border-brighter-green/30 !text-[10px] !font-bold uppercase transition-all"
            />
          </template>
        </template>
        <button 
          @click="resetFilters" 
          class="text-[10px] font-black text-primary-red uppercase tracking-widest hover:underline px-2"
        >
          Limpiar Todo
        </button>
      </div>
    </div>

    <div v-if="salesStore.isLoading" class="flex flex-col items-center justify-center p-20">
      <ProgressSpinner />
      <p class="mt-4 text-primary-green font-bold">{{ salesStore.loadingStep }}</p>
    </div>

    <div v-else-if="salesStore.rawSales.length > 0">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Volumen Total" 
          :value="formatNum(salesStore.totalVolume, 1) + ' m³'" 
          icon="pi pi-chart-bar" 
          iconClass="text-brighter-green"
          :subtitle="salesStore.volumeVariation !== 0 ? `${salesStore.volumeVariation > 0 ? '+' : ''}${formatNum(salesStore.volumeVariation, 1)}% vs mes anterior` : ''"
        />
        <KPICard title="Albaranes Filtrados" :value="formatNum(salesStore.filteredSales.length)" icon="pi pi-ticket" iconClass="text-medium-dark-green" />
        <KPICard 
          title="Día Top Ventas" 
          :value="salesStore.maxSalesDay ? formatNum(salesStore.maxSalesDay.value, 1) + ' m³' : '---'" 
          icon="pi pi-calendar-plus" 
          iconClass="text-pale-green"
          :subtitle="salesStore.maxSalesDay ? salesStore.maxSalesDay.date : ''"
        />
        <KPICard 
          title="Autoconsumo" 
          :value="formatNum(salesStore.selfConsumptionVolume, 1) + ' m³'" 
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
          <Tab value="4">Análisis de Tiempos</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <!-- 1. Ventas por Meses -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Ventas por Meses</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Evolución del volumen de ventas agrupado por meses para detectar tendencias estacionales.</p>
                <div class="h-96">
                  <BasePlotly :data="monthPlotlyData" :layout="commonBarLayout('Volumen Mensual (m³)')" />
                </div>
              </div>
              <!-- 2. Ventas por Días -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Ventas por Días</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Visualización detallada de las fluctuaciones de carga diarias en el periodo seleccionado.</p>
                <div class="h-96">
                  <BasePlotly :data="dayPlotlyData" :layout="commonLineLayout('Ventas Diarias (m³)')" />
                </div>
              </div>
              <!-- 3. Ventas por Comunidad Autónoma -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Ventas por Comunidad Autónoma</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Distribución geográfica del volumen facturado por regiones administrativas.</p>
                <div class="h-80">
                  <BasePlotly :data="(salesStore.communityPlotlyData as any)" :layout="(communityPlotlyLayout as any)" />
                </div>
              </div>
              <!-- 4. Ventas por Planta -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Ventas por Planta</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Comparativa de rendimiento entre las distintas plantas de producción operativas.</p>
                <div class="h-96">
                  <BasePlotly :data="plantaPlotlyData" :layout="plantaPlotlyLayout" />
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
                :value="formatNum(salesStore.uniqueNomenclaturesCount)" 
                icon="pi pi-tag" 
                iconClass="text-primary-green" 
              />
              <KPICard 
                title="Medio Cemento" 
                :value="formatNum(salesStore.averageCementContent, 1) + ' kg/m³'" 
                icon="pi pi-filter" 
                iconClass="text-darker-green" 
              />
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Volumen por Nomenclatura y Resistencia</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Análisis proporcional del volumen despachado categorizado por familia de nomenclatura y resistencia característica.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(salesStore.formulaTreemapData as any)" :layout="(treemapLayout as any)" />
                </div>
              </div>
              
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Contenido Cemento Real por Nomenclatura</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Distribución estadística del pesaje real de cemento (kg/m³) para las dosificaciones de hormigón Armado (HA) y con Fibras (HAF).</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(salesStore.formulaViolinData as any)" :layout="(violinLayout as any)" />
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-8">
              <KPICard 
                title="Volumen Medio / Viaje" 
                :value="formatNum(salesStore.technicalKPIs.avgPerTrip, 2) + ' m³'" 
                icon="pi pi-truck" 
                iconClass="text-blue-600" 
                subtitle="Eficiencia promedio de carga"
              />
              <KPICard 
                title="Top Transportista" 
                :value="salesStore.topTransportista ? salesStore.topTransportista.name : '---'" 
                icon="pi pi-truck" 
                iconClass="text-medium-dark-green" 
                :subtitle="salesStore.topTransportista ? formatNum(salesStore.topTransportista.volume, 1) + ' m³' : ''"
              />
              <KPICard 
                title="Top Camión" 
                :value="salesStore.topTruck ? salesStore.topTruck.matricula : '---'" 
                icon="pi pi-id-card" 
                iconClass="text-pale-green" 
                :subtitle="salesStore.topTruck ? formatNum(salesStore.topTruck.volume, 1) + ' m³' : ''"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Gráfico de Transportistas -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Volumen por Transportista</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Desglose del volumen total por empresa transportista. Deslice para ver el listado completo.</p>
                <div class="overflow-y-auto max-h-[600px] border border-gray-50 dark:border-gray-800 rounded-xl">
                  <div :style="{ height: transportistaChartHeight }">
                    <BasePlotly :data="transportistaPlotlyData" :layout="horizontalBarLayout('m³ Facturados')" />
                  </div>
                </div>
              </div>

              <!-- Gráfico de Matrículas -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Volumen por Matrícula</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Detalle de m³ transportados por cada vehículo registrado en el periodo.</p>
                <div class="overflow-y-auto max-h-[600px] border border-gray-50 dark:border-gray-800 rounded-xl">
                  <div :style="{ height: matriculaChartHeight }">
                    <BasePlotly :data="matriculaPlotlyData" :layout="horizontalBarLayout('m³ Facturados')" />
                  </div>
                </div>
              </div>

              <!-- Treemap de Transporte -->
              <div class="col-span-1 md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 m-6 mb-4">Análisis Transportista > Matrícula</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 px-6 mb-6">Visualización jerárquica de la relación entre empresas de transporte y sus vehículos asociados.</p>
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
                :value="formatNum(salesStore.uniqueClientsCount)" 
                icon="pi pi-users" 
                iconClass="text-primary-green" 
              />
              <KPICard 
                title="Volumen Top 1 Cliente" 
                :value="formatNum(salesStore.topClient.volume, 1) + ' m³'" 
                icon="pi pi-star-fill" 
                iconClass="text-medium-dark-green" 
                :subtitle="salesStore.topClient.name"
              />
              <KPICard 
                title="Volumen Top 3 Clientes" 
                :value="formatNum(salesStore.top3ClientsInfo.volume, 1) + ' m³'" 
                icon="pi pi-chart-line" 
                iconClass="text-pale-green" 
                :subtitle="salesStore.top3ClientsInfo.names"
              />
              <KPICard 
                title="Volumen Top 10 Clientes" 
                :value="formatNum(salesStore.top10ClientsInfo.volume, 1) + ' m³'" 
                icon="pi pi-list" 
                iconClass="text-darker-green" 
                :subtitle="salesStore.top10ClientsInfo.names"
              />
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Concentración de Cartera (Top 10 vs Otros)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Visualice la dependencia de los clientes principales frente al resto de la cartera.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(concentrationChartData as any)" :layout="(concentrationLayout as any)" />
                </div>
              </div>

              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Matriz de Fidelización (Frecuencia vs Volumen)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Análisis de los 10 clientes con mayor volumen. El tamaño de la burbuja representa el promedio de m³ por pedido.</p>
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
                :value="formatNum(salesStore.technicalKPIs.maxTimeToSite) + ' min'" 
                icon="pi pi-map-marker" 
                iconClass="text-orange-600" 
                subtitle="Máximo tiempo de transporte"
              />
              <KPICard 
                title="Tiempo Máximo Descarga" 
                :value="formatNum(salesStore.technicalKPIs.maxUnloadingTime) + ' min'" 
                icon="pi pi-clock" 
                iconClass="text-blue-600" 
                subtitle="Máximo tiempo en obra"
              />
              <KPICard 
                title="Nº Descargas Tardías" 
                :value="formatNum(salesStore.technicalKPIs.lateUnloadingsCount)" 
                icon="pi pi-exclamation-triangle" 
                iconClass="text-red-600" 
                subtitle="Exceso sobre límite de uso"
              />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Gráfico de Eficiencia -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Eficiencia Logística por Planta (Tiempo Viaje vs Descarga)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">El tamaño de la burbuja indica el número de descargas tardías. Cuanto más arriba y a la derecha, mayores son los tiempos máximos.</p>
                <div class="h-[500px]">
                  <BasePlotly :data="(technicalBubbleChartData as any)" :layout="(technicalBubbleLayout as any)" />
                </div>
              </div>

              <!-- Heatmap de Demanda -->
              <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Evolución Semanal de la Demanda (Heatmap)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Visualización de la intensidad de carga por día y semana del año.</p>
                <div :style="{ height: heatmapChartHeight }">
                  <BasePlotly :data="(heatmapChartData as any)" :layout="(heatmapLayout as any)" />
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <div v-else class="max-w-4xl mx-auto py-12">
      <div v-if="salesStore.fileName" class="flex items-center justify-center gap-2 mb-4 animate-fadein">
        <div class="w-2 h-2 rounded-full bg-primary-green animate-pulse"></div>
        <span class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Fichero actual: 
          <span class="text-primary-green dark:text-brighter-green ml-1">{{ salesStore.fileName }}</span>
        </span>
      </div>
      <FileDropZone 
        :error="salesStore.fileError" 
        :missingCols="missingCols"
        @file-selected="onFileSelected" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSalesStore } from '../../application/useSalesStore'
import { ExcelService } from '../../infrastructure/services/ExcelService'
import type { Data, Layout } from 'plotly.js'
import KPICard from '../components/KPICard.vue';
import CustomerSalesTable from '../components/CustomerSalesTable.vue';
import BasePlotly from '../components/BasePlotly.vue'
import PivotSalesTable from '../components/PivotSalesTable.vue'
import FileDropZone from '../components/FileDropZone.vue'
// @ts-ignore
import tailwindConfig from '../../../tailwind.config.js'
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import ProgressSpinner from 'primevue/progressspinner';
import MultiSelect from 'primevue/multiselect';
import Chip from 'primevue/chip';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const salesStore = useSalesStore()
const twColors = (tailwindConfig as any).theme.extend.colors;
const formatNum = (val: number | string | undefined | null, decimals: number = 0) => {
  if (val === undefined || val === null || val === '') return '---'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return val.toString()
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  })
}

const dates = ref<Date[] | null>(null)
const isDark = ref(false)
const missingCols = ref<string[]>([])
const showFilters = ref(false)

const activeFiltersCount = computed(() => {
  let count = 0
  if (salesStore.filters.fabricas?.length) count++
  if (salesStore.filters.comunidades?.length) count++
  if (salesStore.filters.nomenclaturas?.length) count++
  if (salesStore.filters.transportistas?.length) count++
  if (salesStore.filters.matriculas?.length) count++
  if (salesStore.filters.clientes?.length) count++
  return count
})

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  
  // 1. Aplicar clase bloqueadora de transiciones de forma inmediata
  document.documentElement.classList.add('no-transitions')
  
  // 2. Forzar un recálculo de estilos antes de cambiar el tema
  void document.documentElement.offsetHeight;
  
  // 3. Cambiar el tema
  updateTheme()
  
  // 4. Forzar otro recálculo para asegurar que el nuevo tema se pinta sin transiciones
  void document.documentElement.offsetHeight;
  
  // 5. Esperar al siguiente frame para devolver el control a las transiciones
  // Esto garantiza que el usuario vea el cambio como un "salto" instantáneo
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions')
    })
  })
}

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('app-dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('app-dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  updateTheme()
})


const setRange = (type: 'thisMonth' | 'lastMonth' | 'lastQuarter' | 'thisYear' | 'lastYear') => {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (type) {
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'lastQuarter':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1)
      end = new Date(now.getFullYear() - 1, 11, 31)
      break
    default:
      return
  }
  dates.value = [start, end]
}

const onFileSelected = async (file: File) => {
  salesStore.isLoading = true
  salesStore.isExcelLoading = true
  salesStore.loadingStep = 'Cargando archivo...'
  salesStore.setFileError(null)
  salesStore.setFileName(file.name)
  salesStore.setSales([]) // Limpiar datos previos inmediatamente
  resetFilters() // Limpiar filtros previos
  missingCols.value = []
  
  try {
    await ExcelService.processFile(file, (chunk, total, step) => {
      if (step) {
        salesStore.loadingStep = step
        return
      }
      
      salesStore.addSales(chunk)
      
      // Con la nueva estrategia de carga masiva, chunk contendrá todos los registros al final
      salesStore.totalProcessedRecords = total
      salesStore.refreshSalesUI()
      
      // Disparar análisis
      salesStore.isLoading = false 
      salesStore.triggerAnalysis()
    })
    
    salesStore.isExcelLoading = false
    
    // Esperar a que el análisis final termine
    salesStore.triggerAnalysis() 
    await salesStore.waitUntilAnalyzed()
    
    toast.add({ 
      severity: 'success', 
      summary: 'Carga Completada', 
      detail: `Se han procesado ${salesStore.totalProcessedRecords} registros correctamente.`, 
      life: 5000 
    })
  } catch (error: any) {
    console.error(error)
    if (error.type === 'INVALID_HEADER') {
      salesStore.setFileError(error.message)
      missingCols.value = error.details || []
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Error de Carga', 
        detail: error.message || 'Error desconocido al procesar el archivo', 
        life: 5000 
      });
    }
  } finally {
    salesStore.isLoading = false
    salesStore.isExcelLoading = false
  }
}

const resetFilters = () => {
  dates.value = null
  salesStore.setFilters({ 
    startDate: null, 
    endDate: null,
    fabricas: null,
    comunidades: null,
    nomenclaturas: null,
    transportistas: null,
    matriculas: null,
    clientes: null
  })
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let debounceTimeout: any = null

watch(() => salesStore.filters, () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    salesStore.triggerAnalysis()
  }, 300)
}, { deep: true })

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
// --- Plotly Helper Layouts ---
const commonBarLayout = (title: string): Partial<Layout> => ({
  autosize: true,
  margin: { t: 40, l: 50, r: 20, b: 60 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: isDark.value ? twColors['chart-bg-dark'] : twColors['chart-bg-light'],
  font: { family: 'Outfit, sans-serif', color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] },
  xaxis: {
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    tickangle: -45,
    automargin: true
  },
  yaxis: {
    title: { text: title },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  hovermode: 'closest',
  hoverlabel: {
    bgcolor: isDark.value ? '#1f2937' : '#ffffff',
    bordercolor: twColors['primary-green'],
    font: { family: 'Outfit, sans-serif', size: 13, color: isDark.value ? '#f3f4f6' : '#374151' }
  }
});

const commonLineLayout = (title: string): Partial<Layout> => ({
  ...commonBarLayout(title),
  hovermode: 'x unified' as any
});

const horizontalBarLayout = (title: string): Partial<Layout> => ({
  autosize: true,
  margin: { t: 30, l: 150, r: 20, b: 40 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: isDark.value ? twColors['chart-bg-dark'] : twColors['chart-bg-light'],
  font: { family: 'Outfit, sans-serif', color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] },
  xaxis: {
    title: { text: title },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  yaxis: {
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    automargin: true
  },
  bargap: 0.1,
  hovermode: 'closest',
});

// --- Plotly Computed Data ---
const monthPlotlyData = computed<Data[]>(() => [
  {
    x: salesStore.salesByMonth.labels,
    y: salesStore.salesByMonth.values as number[],
    type: 'bar',
    name: 'Volumen Mensual',
    marker: { color: twColors['darker-green'] },
    hovertemplate: '<b>%{x}</b><br>Volumen: %{y:,.0f} m³<extra></extra>'
  },
  {
    x: salesStore.salesByMonth.labels,
    y: new Array(salesStore.salesByMonth.labels.length).fill(salesStore.averageSalesByMonth),
    type: 'scatter',
    mode: 'lines',
    name: 'Media',
    line: { color: twColors['primary-red'], dash: 'dash', width: 2 },
    hovertemplate: 'Media: %{y:,.0f} m³<extra></extra>'
  }
]);

const dayPlotlyData = computed<Data[]>(() => [
  {
    x: salesStore.salesByDay.labels,
    y: salesStore.salesByDay.values as number[],
    type: 'scatter',
    mode: 'lines',
    name: 'Ventas Diarias',
    line: { color: twColors['primary-green'], width: 3 },
    fill: 'tozeroy',
    fillcolor: isDark.value ? 'rgba(0, 166, 81, 0.1)' : 'rgba(0, 166, 81, 0.05)',
    hovertemplate: 'Volumen: %{y:,.0f} m³<extra></extra>'
  },
  {
    x: salesStore.salesByDay.labels,
    y: new Array(salesStore.salesByDay.labels.length).fill(salesStore.averageSalesByDay),
    type: 'scatter',
    mode: 'lines',
    name: 'Media',
    line: { color: twColors['primary-red'], dash: 'dash', width: 2 },
    hovertemplate: 'Media: %{y:,.0f} m³<extra></extra>'
  }
]);

const plantaPlotlyData = computed<Data[]>(() => {
  const data = Object.entries(salesStore.volumeByPlanta)
    .sort(([a], [b]) => a.localeCompare(b));
  
  const labels = data.map(([k]) => k);
  const values = data.map(([, v]) => v as number);

  return [
    {
      x: labels,
      y: values,
      type: 'bar',
      name: 'm³',
      marker: { color: twColors['medium-dark-green'] },
      hovertemplate: '<b>%{x}</b><br>Volumen: %{y:,.0f} m³<extra></extra>'
    },
    {
      x: labels,
      y: new Array(labels.length).fill(salesStore.averageVolumeByPlanta),
      type: 'scatter',
      mode: 'lines',
      name: 'Media',
      line: { color: twColors['primary-red'], dash: 'dash', width: 2 },
      hovertemplate: 'Media General: %{y:,.0f} m³<extra></extra>'
    }
  ];
});

const plantaPlotlyLayout = computed(() => {
  const base = commonBarLayout('m³ por Planta');
  return {
    ...base,
    xaxis: {
      ...base.xaxis,
      dtick: 1, // Forzar que aparezcan todas las etiquetas si es categoría
      type: 'category' as any
    }
  };
});

const transportistaPlotlyData = computed<Data[]>(() => {
  const data = salesStore.volumeByTransportista;
  // Revertimos para que el mayor volumen esté arriba (Plotly dibuja de abajo a arriba por defecto en categorías)
  const keys = Object.keys(data).reverse();
  const values = Object.values(data).map((v: any) => v.volume).reverse();
  
  return [{
    y: keys,
    x: values,
    type: 'bar',
    orientation: 'h',
    name: 'm³ Facturados',
    marker: { color: twColors['darker-green'] },
    hovertemplate: '<b>%{y}</b><br>Volumen: %{x:,.0f} m³<extra></extra>'
  }];
});

const matriculaPlotlyData = computed<Data[]>(() => {
  const data = salesStore.volumeByMatricula;
  // Revertimos para que el mayor volumen esté arriba
  const keys = Object.keys(data).reverse();
  const values = Object.values(data).map((v: any) => v.volume).reverse();
  
  return [{
    y: keys,
    x: values,
    type: 'bar',
    orientation: 'h',
    name: 'm³ Facturados',
    marker: { color: twColors['medium-dark-green'] },
    hovertemplate: '<b>%{y}</b><br>Volumen: %{x:,.0f} m³<extra></extra>'
  }];
});

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
        colors: [twColors['primary-green'], twColors['medium-dark-green']],
        line: { width: 1.5, color: '#000000' }
      },
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
      insidetextorientation: 'radial'
    }
  ];
});

const concentrationLayout = computed(() => ({
  autosize: true,
  margin: { t: 40, l: 20, r: 20, b: 40 },
  showlegend: true,
  legend: { 
    orientation: 'h' as any, 
    y: -0.1, 
    x: 0.5, 
    xanchor: 'center' as any,
    font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { 
    family: 'Outfit, sans-serif', 
    color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] 
  }
}));

const bubbleChartData = computed(() => {
  const data = [...salesStore.customerLoyaltyData]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
    
  return [
    {
      x: data.map(d => d.frequency),
      y: data.map(d => d.volume),
      text: data.map(d => `<b>${d.name}</b><br>Pedidos: ${d.frequency}<br>Volumen: ${d.volume.toLocaleString()} m³<br>Media: ${d.average.toFixed(2)} m³/pedido`),
      mode: 'markers',
      marker: {
        size: data.map(d => d.average),
        sizemode: 'area',
        sizeref: data.length > 0 ? 2.0 * Math.max(...data.map(d => d.average)) / (40 ** 2) : 1,
        sizemin: 4,
        color: data.map(d => d.volume),
        colorscale: 'Greens',
        showscale: true,
        reversescale: true,
        opacity: 0.7,
        line: { width: 1.5, color: '#000000' }
      }
    }
  ];
});

const bubbleLayout = computed(() => ({
  autosize: true,
  margin: { t: 40, l: 60, r: 20, b: 60 },
  hovermode: 'closest' as any,
  xaxis: {
    title: { 
      text: 'Frecuencia (Número de Pedidos)',
      font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    zeroline: false
  },
  yaxis: {
    title: { 
      text: 'Volumen Total (m³)',
      font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    zeroline: false
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: isDark.value ? twColors['chart-bg-dark'] : twColors['chart-bg-light'],
  font: { 
    family: 'Outfit, sans-serif',
    color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700]
  }
}));

const heatmapChartData = computed(() => {
  const data = salesStore.technicalHeatmapData;
  return [
    {
      x: data.x,
      y: data.y,
      z: data.z,
      type: 'heatmap',
      xgap: 1.5,
      ygap: 1.5,
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
  const data = salesStore.technicalKPIsByPlant as any[];
  return [
    {
      x: data.map((d: any) => d.maxTimeToSite),
      y: data.map((d: any) => d.maxUnloadingTime),
      text: data.map((d: any) => `<b>Planta: ${d.name}</b><br>T. Máx Viaje: ${d.maxTimeToSite.toFixed(0)} min<br>T. Máx Descarga: ${d.maxUnloadingTime.toFixed(0)} min<br>Descargas Tardías: ${d.lateUnloadings}`),
      mode: 'markers',
      marker: {
        size: data.map((d: any) => d.lateUnloadings),
        sizemode: 'area',
        sizeref: 2.0 * Math.max(...data.map((d: any) => d.lateUnloadings), 1) / (60 ** 2),
        sizemin: 10,
        color: data.map((d: any) => d.lateUnloadings),
        colorscale: 'Greens',
        showscale: true,
        reversescale: true,
        opacity: 0.7,
        line: { width: 1.5, color: '#000000' }
      }
    }
  ];
});

const technicalBubbleLayout = computed(() => ({
  autosize: true,
  margin: { t: 40, l: 60, r: 20, b: 60 },
  hovermode: 'closest' as any,
  xaxis: {
    title: { 
      text: 'T. Máximo a Obra (min)',
      font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    zeroline: false
  },
  yaxis: {
    title: { 
      text: 'T. Máximo Descarga (min)',
      font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] },
    zeroline: false
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: isDark.value ? twColors['chart-bg-dark'] : twColors['chart-bg-light'],
  font: { 
    family: 'Outfit, sans-serif',
    color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700]
  }
}));

const heatmapLayout = computed(() => ({
  autosize: true,
  margin: { t: 60, l: 120, r: 20, b: 60 },
  xaxis: {
    title: { 
        text: 'Día de la Semana', 
        standoff: 20,
        font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    side: 'top' as any,
    fixedrange: true,
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  yaxis: {
    title: { 
        text: 'Semanas', 
        standoff: 20,
        font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    autorange: 'reversed',
    fixedrange: true,
    dtick: 1,
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { 
    family: 'Outfit, sans-serif',
    color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700]
  }
}));

const treemapLayout = computed(() => ({
  autosize: true,
  margin: { t: 30, l: 0, r: 0, b: 0 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { 
    family: 'Outfit, sans-serif',
    size: 12,
    color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][800]
  },
  hoverlabel: {
    bgcolor: isDark.value ? twColors['brand-gray'][800] : twColors['brand-gray'][0],
    font: { family: 'Outfit, sans-serif', size: 14, color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][800] }
  }
}));

const communityPlotlyLayout = computed(() => ({
  autosize: true,
  margin: { t: 40, l: 40, r: 40, b: 40 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { 
    family: 'Outfit, sans-serif',
    color: isDark.value ? '#ffffff' : twColors['brand-gray'][700]
  },
  showlegend: true,
  legend: {
    orientation: 'h' as any,
    y: -0.1,
    x: 0.5,
    xanchor: 'center' as any,
    font: { color: isDark.value ? twColors['brand-gray'][200] : twColors['brand-gray'][600] }
  }
}));

const violinLayout = computed(() => ({
  margin: { t: 30, l: 60, r: 30, b: 80 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  yaxis: {
    title: { 
      text: 'Cemento (kg/m³)',
      font: { color: isDark.value ? twColors['brand-gray'][50] : twColors['brand-gray'][700] }
    },
    zeroline: false,
    gridcolor: isDark.value ? twColors['brand-gray'][700] : twColors['brand-gray'][100],
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  xaxis: {
    type: 'category',
    tickmode: 'linear',
    dtick: 1,
    tickangle: 45,
    tickfont: { color: isDark.value ? twColors['brand-gray'][400] : twColors['brand-gray'][500] }
  },
  showlegend: false
}));
</script>
