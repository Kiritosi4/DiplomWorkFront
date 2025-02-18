<template>
    <el-date-picker
        v-model="defaultStart"
        type="daterange"
        unlink-panels
        range-separator="-"
        :default-time="defaultStart"
        start-placeholder="От"
        end-placeholder="До"
        :shortcuts="shortcuts"
        :size="size"
    />
</template>
  
<script setup>
import { ref } from 'vue'
import * as dateCalc from '@/api/dateCalculator';

const defaultStart = ref([dateCalc.getStartOfMonth(), new Date()])

const shortcuts = [
{
    text: 'Этот день',
    value: () => {
    return [dateCalc.getStartOfDay(), new Date()]
    },
},
{
    text: 'Эта неделя',
    value: () => {
    return [dateCalc.getStartOfWeek(), new Date()]
    },
},
{
    text: 'Этот месяц',
    value: () => {
    return [dateCalc.getStartOfMonth(), new Date()]
    },
},
{
    text: 'Этот год',
    value: () => {
    return [dateCalc.getStartOfYear(), new Date()]
    },
},
{
    text: 'За 1 день',
    value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24)
    return [start, end]
    },
},
{
    text: 'За 7 дней',
    value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
    return [start, end]
    },
},
{
    text: 'За 30 дней',
    value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
    return [start, end]
    },
},
{
    text: 'За 1 год',
    value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30 * 12)
    return [start, end]
    },
},
]
</script>