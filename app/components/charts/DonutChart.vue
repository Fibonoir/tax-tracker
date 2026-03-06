<template>
  <div class="chart-wrap" :style="{ height: height + 'px' }">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{
  irpef: number
  inps: number
  accountant: number
  net: number
  height?: number
}>()

const colorMode = useColorMode()
const { eur } = useFmt()

const chartData = computed(() => ({
  labels: ['Net', 'IRPEF', 'INPS', 'Commercialista'],
  datasets: [{
    data: [props.net, props.irpef, props.inps, props.accountant],
    backgroundColor: ['#1f8f69', '#c96948', '#d2a14b', '#8b9792'],
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${eur(ctx.raw)}`,
      },
      backgroundColor: colorMode.value === 'dark' ? '#0f1f1a' : '#fffdf8',
      titleColor: colorMode.value === 'dark' ? '#99aba5' : '#6f7d78',
      bodyColor: colorMode.value === 'dark' ? '#f7f4eb' : '#1f2e29',
      borderColor: colorMode.value === 'dark' ? '#27493f' : '#e0d7c5',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleFont: { family: 'IBM Plex Mono', size: 10 },
      bodyFont: { family: 'IBM Plex Mono', size: 12, weight: 'bold' },
    },
  },
}))
</script>
