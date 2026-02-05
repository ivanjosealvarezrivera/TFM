<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-lighter-pale-green flex flex-col items-center text-center">
    <div class="text-4xl mb-2" :class="iconClass">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </div>
    <div class="text-3xl font-bold text-primary-green">{{ value }}</div>
    <div class="text-sm font-medium text-gray-500 uppercase tracking-wider">{{ title }}</div>
    <div v-if="subtitle" class="text-xs text-gray-400 mt-1 whitespace-pre-line">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon?: string
  iconClass?: string
  subtitle?: string
}>()
</script>
