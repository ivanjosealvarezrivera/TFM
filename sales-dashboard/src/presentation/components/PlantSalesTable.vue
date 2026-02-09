<template>
  <div class="bg-white dark:bg-brand-gray-950 rounded-2xl shadow-sm border border-brand-gray-100 dark:border-brand-gray-800 overflow-hidden transition-colors duration-300">
    <div class="p-6 border-b border-brand-gray-100 dark:border-brand-gray-800 flex justify-between items-center bg-brand-gray-50/50 dark:bg-brand-gray-800/50">
      <h3 class="text-lg font-bold text-brand-gray-700 dark:text-brand-gray-200">Rendimiento por Planta</h3>
      <span class="text-sm text-brand-gray-500 dark:text-brand-gray-400 font-medium">{{ data.length }} plantas activas</span>
    </div>
    
    <DataTable 
      :value="data" 
      stripedRows 
      paginator 
      :rows="10" 
      :rowsPerPageOptions="[10, 20, 50]"
      class="p-datatable-sm custom-table"
      removableSort
      sortField="volume"
      :sortOrder="-1"
    >
      <Column field="name" header="Planta / Comunidad" sortable class="min-w-[250px]">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-bold text-slate-900 dark:text-gray-100 uppercase text-xs">{{ data.name }}</span>
            <span class="text-[10px] text-slate-500 dark:text-gray-400 font-mono">{{ data.comunidad }}</span>
          </div>
        </template>
      </Column>
      
      <Column field="volume" header="Volumen Total" sortable>
        <template #body="{ data }">
          <span class="font-bold text-emerald-900 dark:text-emerald-400">{{ data.volume.toLocaleString() }} m³</span>
        </template>
      </Column>
      
      <Column field="frequency" header="Nº Albaranes" sortable class="text-center">
        <template #body="{ data }">
          <Tag :value="data.frequency" severity="success" rounded class="font-black text-emerald-950 dark:text-emerald-50" />
        </template>
      </Column>
      
      <Column field="average" header="Media / Albarán" sortable>
        <template #body="{ data }">
          <span class="text-emerald-800 dark:text-emerald-300 font-semibold">{{ data.average.toFixed(2) }} m³</span>
        </template>
      </Column>
      
      <Column field="firstPurchase" header="Primer Suministro" sortable>
        <template #body="{ data }">
          <span class="text-slate-600 dark:text-gray-400 text-sm">{{ formatDate(data.firstPurchase) }}</span>
        </template>
      </Column>
      
      <Column field="lastPurchase" header="Último Suministro" sortable>
        <template #body="{ data }">
          <span class="text-slate-900 dark:text-gray-100 font-bold text-sm">{{ formatDate(data.lastPurchase) }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

defineProps<{
  data: Array<{
    name: string;
    comunidad: string;
    volume: number;
    frequency: number;
    average: number;
    firstPurchase: string;
    lastPurchase: string;
  }>
}>();

const formatDate = (dateStr: string) => {
  if (!dateStr) return '---';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};
</script>

<style scoped>
.custom-table :deep(.p-datatable-thead > tr > th) {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 1rem;
}

.custom-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
}

.custom-table :deep(.p-tag-success) {
  background-color: var(--color-lighter-pale-green);
  color: var(--color-primary-green);
}

:host-context(.app-dark) .custom-table :deep(.p-tag-success),
.app-dark .custom-table :deep(.p-tag-success) {
  background-color: theme('colors.darker-green') !important;
  color: theme('colors.light-greenish-bg') !important;
}
</style>
