<script setup>
import { computed } from 'vue';

const props = defineProps({
    category: String,
    date : String,
    amount: Number,
    profit: Boolean
})
</script>

<template>
<div class="row">
    <div class="text-info">
        <span>{{ category }}</span>
        <span :class="profit ? 'profit' : 'amount'">{{ profit ? '+' : '-' }}{{ amount }} ₽</span>
    </div>
    <div class="date-info">
        <span>{{ date }}</span>
    </div>
</div>
</template>

<style scoped>
.row {
    
    display: flex;
    flex-direction: column;
    transition: .3s;
    padding: 7px 5px;
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

.profit {
    color: #19ad3a;
    font-weight: 400;
}
</style>