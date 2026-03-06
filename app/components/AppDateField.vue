<template>
  <UPopover :content="{ side: 'bottom', align: 'start', sideOffset: 10 }">
    <button type="button" class="ui-date-trigger" :class="{ 'is-empty': !modelValue }">
      <span>{{ displayValue }}</span>
      <UIcon name="lucide:calendar-days" class="w-4 h-4" />
    </button>

    <template #content="{ close }">
      <div class="ui-date-panel">
        <UCalendar
          :model-value="calendarValue"
          class="ui-date-calendar"
          :fixed-weeks="false"
          :week-starts-on="1"
          :year-controls="false"
          @update:model-value="updateValue($event, close)"
        />

        <div class="ui-date-panel__footer">
          <button type="button" class="ui-date-panel__action" @click="clear(close)">
            Cancella
          </button>
          <button type="button" class="ui-date-panel__action is-primary" @click="selectToday(close)">
            Oggi
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: 'Seleziona una data',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const calendarValue = computed(() => (
  props.modelValue ? parseDate(props.modelValue) : undefined
))

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder

  const [year, month, day] = props.modelValue.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
})

function updateValue(value: any, close?: () => void) {
  emit('update:modelValue', value?.toString?.() ?? '')
  close?.()
}

function selectToday(close?: () => void) {
  emit('update:modelValue', today(getLocalTimeZone()).toString())
  close?.()
}

function clear(close?: () => void) {
  emit('update:modelValue', '')
  close?.()
}
</script>
