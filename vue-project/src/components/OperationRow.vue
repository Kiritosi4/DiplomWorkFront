<script setup>
import { computed } from 'vue';

const props = defineProps({
    category: String,
    date : String,
    amount: Number
})
</script>

<template>
<div class="row">
    <div class="text-info">
        <span>{{ category }}</span>
        <span class="amount">-{{ amount }} ₽</span>
    </div>
    <div class="date-info">
        <span>{{ date }}</span>
    </div>
</div>
</template>

<style scoped>
.row {
    min-height: 45px;
    display: flex;
    flex-direction: column;
    transition: .3s;
    padding: 5px;
    border-radius: 4px;
}

.row:hover {
    cursor: pointer;
    background-color: hsl(0, 5%, 88%);
}

.text-info {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
    font-weight: 500;
}

.date-info {
    font-weight: 400;
    font-size: 0.9rem;
    color: #606266;
}

.amount {
    color: #f56c6c;
    font-weight: 400;
}
</style>