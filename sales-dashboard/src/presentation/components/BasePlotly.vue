<template>
  <div ref="plotlyDiv" class="w-full h-full min-h-[400px]"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'

const props = defineProps<{
  data: any[]
  layout: any
}>()

const plotlyDiv = ref<HTMLElement | null>(null)

const renderPlotly = () => {
  if (plotlyDiv.value) {
    Plotly.newPlot(plotlyDiv.value, props.data, props.layout, { responsive: true })
  }
}

onMounted(renderPlotly)
onUnmounted(() => {
  if (plotlyDiv.value) Plotly.purge(plotlyDiv.value)
})

watch(() => [props.data, props.layout], renderPlotly, { deep: true })
</script>
