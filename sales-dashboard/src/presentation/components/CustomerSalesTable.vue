<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
      <h3 class="text-lg font-bold text-gray-700">Detalle de Compras por Cliente</h3>
      <span class="text-sm text-gray-500 font-medium">{{ data.length }} clientes registrados</span>
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
      <Column field="name" header="Nombre Cliente / NIF" sortable class="min-w-[300px]">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-bold text-slate-900 uppercase text-xs">{{ data.name }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ data.nif }}</span>
          </div>
        </template>
      </Column>
      
      <Column field="volume" header="Volumen Total" sortable>
        <template #body="{ data }">
          <span class="font-bold text-emerald-900">{{ data.volume.toLocaleString() }} m³</span>
        </template>
      </Column>
      
      <Column field="frequency" header="Nº Compras" sortable class="text-center">
        <template #body="{ data }">
          <Tag :value="data.frequency" severity="success" rounded class="font-black text-emerald-950" />
        </template>
      </Column>
      
      <Column field="average" header="Volumen Medio/Compra" sortable>
        <template #body="{ data }">
          <span class="text-emerald-800 font-semibold">{{ data.average.toFixed(2) }} m³</span>
        </template>
      </Column>
      
      <Column field="firstPurchase" header="Primera Compra" sortable>
        <template #body="{ data }">
          <span class="text-slate-600 text-sm">{{ formatDate(data.firstPurchase) }}</span>
        </template>
      </Column>
      
      <Column field="lastPurchase" header="Última Compra" sortable>
        <template #body="{ data }">
          <span class="text-slate-900 font-bold text-sm">{{ formatDate(data.lastPurchase) }}</span>
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
    nif: string;
    name: string;
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
/* Contenedor principal forzado a blanco */
.bg-white {
  background-color: #ffffff !important;
}

.custom-table :deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc !important;
  color: #475569 !important;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.custom-table :deep(.p-datatable-tbody > tr) {
  background-color: #ffffff !important;
  color: #1e293b !important;
}

.custom-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  background-color: inherit;
}

/* Filas alternas (zebra) */
.custom-table :deep(.p-datatable-tbody > tr.p-row-odd) {
  background-color: #fafafa !important;
}

.custom-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f0fdf4 !important;
}

.custom-table :deep(.p-tag-success) {
  background-color: #dcfce7 !important;
  color: #064e3b !important;
  font-weight: 900 !important;
}

.custom-table :deep(.p-paginator) {
  background-color: #ffffff !important;
  border-top: 1px solid #f1f5f9;
  padding: 0.75rem;
}

.custom-table :deep(.p-paginator .p-paginator-page),
.custom-table :deep(.p-paginator .p-paginator-next),
.custom-table :deep(.p-paginator .p-paginator-last),
.custom-table :deep(.p-paginator .p-paginator-first),
.custom-table :deep(.p-paginator .p-paginator-prev) {
  color: #64748b !important;
}

.custom-table :deep(.p-paginator .p-paginator-page.p-highlight) {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
}
</style>
