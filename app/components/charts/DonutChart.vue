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
    backgroundColor: ['#00d09c', '#ff6b6b', '#ffb34c', '#a0a0a8'],
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
      backgroundColor: colorMode.preference === 'dark' ? '#1a1a1d' : '#ffffff',
      titleColor: colorMode.preference === 'dark' ? '#a0a0a8' : '#666666',
      bodyColor: colorMode.preference === 'dark' ? '#fafafa' : '#0c0c0e',
      borderColor: colorMode.preference === 'dark' ? '#2a2a2d' : '#e5e5e5',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: { family: 'JetBrains Mono', size: 10 },
      bodyFont: { family: 'JetBrains Mono', size: 12, weight: 'bold' },
    },
  },
}))
</script>
