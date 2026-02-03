<template>
  <div class="pivot-container bg-white rounded-2xl shadow-sm border border-gray-100">
    <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h3 class="text-lg font-bold text-gray-700">Matriz de Ventas por Planta (m³)</h3>
      <span class="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
        {{ data.rows.length }} Días / {{ data.columns.length }} Plantas
      </span>
    </div>
    
    <div class="table-wrapper">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="sticky-header sticky-col-left z-30">Fecha</th>
            <th v-for="plant in data.columns" :key="plant" class="sticky-header vertical-header">
              <div class="vertical-text">{{ plant }}</div>
            </th>
            <th class="sticky-header sticky-col-right z-30">Total Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.rows" :key="row.date" class="hover:bg-gray-50 transition-colors">
            <td class="sticky-col-left font-bold text-gray-700 text-xs">
              {{ row.date }}
            </td>
            <td v-for="plant in data.columns" :key="plant" 
                class="data-cell text-right"
                :class="{ 'empty-cell': row[plant] === 0 }">
              {{ row[plant] !== 0 ? row[plant].toFixed(1) : '-' }}
            </td>
            <td class="sticky-col-right text-right font-black text-primary-green bg-primary-green/5 text-xs">
              {{ row.total.toFixed(1) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-100 text-gray-800 font-medium text-[9px]">
          <tr class="border-t-2 border-primary-green">
            <th class="sticky-col-left z-20 bg-gray-200 font-bold px-2 py-1">TOTAL</th>
            <td v-for="plant in data.columns" :key="plant" class="p-1 border border-white/20 text-right font-bold text-primary-green bg-primary-green/5">
              {{ (data.plantTotals && data.plantTotals[plant]) ? data.plantTotals[plant].toFixed(1) : '0.0' }}
            </td>
            <th class="grand-total-cell sticky-col-right font-black text-right px-2 py-1">
              {{ data.grandTotal?.toFixed(1) || '0.0' }}
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    columns: string[];
    rows: any[];
    plantTotals: Record<string, number>;
    grandTotal: number;
  }
}>()
</script>

<style scoped>
.pivot-container {
  width: 100%;
  overflow: hidden;
}

.table-wrapper {
  overflow: auto;
  max-height: 600px;
}

table {
  width: 100%;
  border-spacing: 0;
  table-layout: auto;
}

/* Cabecera y Pie de página */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #004730;
  color: white;
  padding: 4px;
  border: 1px solid rgba(255,255,255,0.05);
  font-size: 9px;
  font-weight: 400; /* No negrita en plantas */
}

/* Rotación de Texto */
.vertical-header {
  height: 130px;
  vertical-align: bottom;
  padding-bottom: 12px;
}

.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  text-align: left;
  margin: 0 auto;
  line-height: 1;
  opacity: 0.9;
}

/* Columnas fijas laterales */
.sticky-col-left {
  position: sticky;
  left: 0;
  z-index: 10;
  padding: 4px 6px;
  background-color: #fcfcfc;
  border-right: 2px solid #edeff2;
}

.sticky-col-right {
  position: sticky;
  right: 0;
  z-index: 10;
  padding: 4px 6px;
  background-color: #fcfcfc;
  border-left: 2px solid #edeff2;
}

/* Intersecciones */
th.sticky-col-left.sticky-header,
th.sticky-col-right.sticky-header {
  z-index: 50;
  background-color: #004730;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Celdas de datos */
.data-cell {
  padding: 2px 3px;
  border: 1px solid #f8f9fa;
  font-size: 9px;
  font-weight: 500;
  color: #2d3748;
}

.empty-cell {
  color: #e2e8f0;
  font-weight: 300;
}

.grand-total-cell {
  background-color: #004730 !important;
  color: white !important;
  z-index: 30 !important;
  font-size: 11px;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}

tr:hover .data-cell {
  background-color: rgba(75, 127, 97, 0.03);
}

th.sticky-header.sticky-col-left,
th.sticky-header.sticky-col-right {
  z-index: 40; /* Por encima de todo */
  background-color: #004730;
}
</style>
