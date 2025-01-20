<script setup>
import { computed } from 'vue';

const props = defineProps({
    title: String,
    amount : Number,
    limit: Number
})

const percentage = computed(() => {
    return Math.floor((props.amount / props.limit) * 100); // Умножаем на 100 и округляем
});

const customColors = [
    { color: '#1989fa', percentage: 50 },
    { color: '#e6a23c', percentage: 75 },
    { color: '#f56c6c', percentage: 100 },
]
</script>

<template>
<div class="row">
    <div class="text-info">
        <span>{{ title }}</span>
        <span>{{ amount }} / {{ limit }} ₽</span>
    </div>
    <div class="progress-bar">
        <el-progress :percentage="percentage" :color="customColors" />
    </div>
</div>
</template>

<style scoped>
.row {
    min-height: 45px;
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    transition: .3s;
    gap: 5px;
}

.text-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    font-weight: 500;
}
</style>