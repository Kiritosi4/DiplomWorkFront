<script setup>
import { computed } from 'vue';
import { Check } from '@element-plus/icons-vue';

const props = defineProps({
    title: String,
    amount : Number,
    limit: Number,
})

const percentage = computed(() => {
    return Math.floor((props.amount / props.limit) * 100); // Умножаем на 100 и округляем
});

const customColors = [
    { color: '#f56c6c', percentage: 50 },
    { color: '#1989fa', percentage: 75 },
    { color: '#00e396', percentage: 100 },
]
</script>

<template>
<div class="row">
    <div class="text-info">
        <span>{{ title }}</span>
        <span>{{ amount }} / {{ limit }} ₽</span>
    </div>
    <div class="progress-bar">
        <el-progress 
        :percentage="percentage" 
        :color="customColors" 
        :stroke-width="8"
        :style="{ '--el-border-color-lighter': '#ffffff' }"
        />
    </div>
    <div class="footer">
        <span style="color: green;"></span>
        <span>{{ Number(limit - amount).toFixed(2) }} ₽ осталось</span>
    </div>
</div>
</template>

<style scoped>
.row {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    transition: .3s;
    gap: 2.5px;
    padding-inline: 8px;
    padding-block: 3px;
    position: relative;
}

.row:hover {
    background-color: #dbdbdb;
    cursor: pointer;
}

.text-info {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
    font-weight: 500;
}

.footer {
    color: #606266;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
}
</style>