<template>
  <div class="relative w-full h-[400px]">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js/auto'

const props = defineProps<{
  config: ChartConfiguration
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const renderChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  if (chartCanvas.value) {
    chartInstance = new Chart(chartCanvas.value, props.config)
  }
}

onMounted(renderChart)
onUnmounted(() => {
  chartInstance?.destroy()
})

watch(() => props.config, renderChart, { deep: true })
</script>
