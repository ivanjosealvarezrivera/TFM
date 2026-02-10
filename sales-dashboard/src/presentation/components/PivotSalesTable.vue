<template>
  <div class="bg-white dark:bg-brand-gray-950 rounded-2xl shadow-sm border border-brand-gray-100 dark:border-brand-gray-800 overflow-hidden transition-colors duration-300">
    <div class="p-6 border-b border-brand-gray-100 dark:border-brand-gray-800 flex justify-between items-center bg-brand-gray-50/50 dark:bg-brand-gray-800/50">
      <h3 class="text-lg font-bold text-brand-gray-700 dark:text-brand-gray-200">Matriz de Ventas por Planta (m³)</h3>
      <span class="text-sm text-brand-gray-500 dark:text-brand-gray-400 font-medium">{{ data.rows.length }} días registrados</span>
    </div>
    
    <DataTable 
      :value="data.rows" 
      stripedRows 
      paginator 
      :rows="10" 
      :rowsPerPageOptions="[10, 20, 50, 100]"
      class="p-datatable-sm custom-table"
      removableSort
    >
      <Column field="date" header="Fecha" sortable class="min-w-[90px]">
        <template #body="{ data }">
          <span class="font-bold text-slate-900 dark:text-brand-gray-100 text-[10px]">{{ data.date }}</span>
        </template>
      </Column>
      
      <Column v-for="plant in data.columns" :key="plant" :field="plant" sortable class="text-right">
        <template #header>
          <div class="vertical-header-text">
            {{ plant }}
          </div>
        </template>
        <template #body="{ data }">
          <span :class="data[plant] > 0 ? 'text-slate-700 dark:text-brand-gray-200 font-medium' : 'text-slate-300 dark:text-brand-gray-600 font-light'" class="text-[10px]">
            {{ data[plant] > 0 ? data[plant].toFixed(1) : '-' }}
          </span>
        </template>
      </Column>
      
      <Column field="total" header="Total" sortable class="text-right min-w-[80px] bg-emerald-50/50 dark:bg-emerald-950/20">
        <template #body="{ data }">
          <span class="font-black text-emerald-900 dark:text-emerald-400 text-[10px]">{{ data.total.toFixed(1) }}</span>
        </template>
      </Column>

      <template #footer v-if="data.plantTotals">
        <div class="flex items-center justify-between p-2 px-6 bg-slate-50 dark:bg-gray-800 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-gray-300">
          <span>Totales Generales</span>
          <div class="flex gap-8">
            <span class="text-emerald-700 dark:text-emerald-400">Total Volumen: {{ data.grandTotal?.toLocaleString() }} m³</span>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

defineProps<{
  data: {
    columns: string[];
    rows: any[];
    plantTotals: Record<string, number>;
    grandTotal: number;
  }
}>();
</script>

<style scoped>
.custom-table :deep(.p-datatable-thead > tr > th) {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.02em;
  padding: 0.4rem 0.2rem !important;
  white-space: nowrap;
  vertical-align: bottom;
  height: 120px;
}

.vertical-header-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: left;
  margin: 0 auto;
  line-height: 1;
  padding-bottom: 5px;
}

.custom-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.3rem !important;
  font-size: 0.7rem;
}

.custom-table :deep(.p-datatable-footer) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.plant-header {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
