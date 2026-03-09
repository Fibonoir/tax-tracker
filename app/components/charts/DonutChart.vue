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
    backgroundColor: ['#2f6b57', '#c96948', '#c59a4e', '#5f7d93'],
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
      backgroundColor: colorMode.value === 'dark' ? '#0f1f1a' : '#fbfcfa',
      titleColor: colorMode.value === 'dark' ? '#99aba5' : '#5f6e67',
      bodyColor: colorMode.value === 'dark' ? '#f7f4eb' : '#1c2823',
      borderColor: colorMode.value === 'dark' ? '#27493f' : '#d5ddd7',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleFont: { family: 'IBM Plex Mono', size: 10 },
      bodyFont: { family: 'IBM Plex Mono', size: 12, weight: 'bold' },
    },
  },
}))
</script>
