<script setup>
import Header from '../components/Header.vue';
import ProgressRow from '@/components/ProgressRow.vue';
import StatiscticCards from '../components/StatiscticCards.vue';
import { ref } from 'vue';
import * as dateCalc from '@/api/dateCalculator';

const pickedPeriod = ref([dateCalc.getStartOfMonth(), new Date()])

const onPeriodChanged  = () => {
    console.log(pickedPeriod.value)
}

const mainchart_series = ref([{
    name: 'Доходы',
    type: 'column',
    data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6]
    }, 
    {
    name: 'Расходы',
    type: 'column',
    data: [1.1, 3, 3.1, 4, 4.1, 4.9, 6.5, 8.5]
    }, 
    {
    name: 'Остатки',
    type: 'line',
    data: [0.5, 1, 1, 3, 1, 2, 3, 4]
}])

const mainchart_options = ref({
    xaxis: {
        categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
    }
})

const expense_series = ref([44, 55, 41, 17, 15])
const profit_series = ref([44, 55, 41, 17, 15])
const expense_chartOptions = {
    chart: {
        type: 'donut',
    },
    labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
    responsive: [{
        breakpoint: 480,
        options: {
        chart: {
            width: 200
        },
        legend: {
            position: 'bottom'
        }
        }
    }]
}

const budgetsList = ref([
  {
    name: 'Еда',
    amount: 600,
    limit: 1000,
  },
  {
    name: 'Топливо',
    amount: 100,
    limit: 1000,
  },
  {
    name: 'Развлечения',
    amount: 900,
    limit: 1000,
  }
])

const targetsList = ref([
  {
    name: 'Еда',
    amount: 600,
    limit: 1000,
  },
  {
    name: 'Топливо',
    amount: 100,
    limit: 1000,
  },
  {
    name: 'Развлечения',
    amount: 900,
    limit: 1000,
  }
])
</script>

<template>
    <Header :activeTab="1" />
    <div class = "content">
        <div class = "wrapper">
            <div class="toolbar">
                <h1>Дашборд</h1>
                <el-date-picker
                    v-model="pickedPeriod"
                    type="daterange"
                    unlink-panels
                    range-separator="-"
                    :default-time="pickedPeriod"
                    start-placeholder="От"
                    end-placeholder="До"
                    :shortcuts="dateCalc.calendarShortcuts"
                    @change="onPeriodChanged()"
                    style="max-width: 400px; min-height: 35px;"
                />
            </div>
            
            <div class="main-stats">
                <StatiscticCards/>
            </div>
            <div class = "main-chart">
                <span>Доходы и расходы</span>
                <apexchart height="350" type="line" :options="mainchart_options" :series="mainchart_series"></apexchart>
            </div>
            <div class = "expense-profit-container">
                <div class="profits piechart-container">
                    Структура доходов
                    <div class="pie-chart">
                        <apexchart type="donut" :options="expense_chartOptions" :series="profit_series" height="300"></apexchart>
                    </div>
                    <div class="chart-list">
                        
                    </div>
                </div>
                <div class="expenses piechart-container">
                    Структура расходов
                    <div class="pie-chart">
                        <apexchart type="donut" :options="expense_chartOptions" :series="expense_series" height="300"></apexchart>
                    </div>
                    <div class="chart-list">

                    </div>
                </div>
                
            </div>
            <div class = "expense-profit-container">
                <div class="profits piechart-container">
                    Бюджеты
                    <div class="chart-list">
                        <ProgressRow 
                            v-for="item in budgetsList"
                            :key="item.name"
                            :title="item.name"
                            :amount="item.amount"
                            :limit="item.limit"
                            />
                    </div>
                </div>
                <div class="expenses piechart-container">
                    Цели
                    <div class="chart-list">
                        <ProgressRow 
                            v-for="item in targetsList"
                            :key="item.name"
                            :title="item.name"
                            :amount="item.amount"
                            :limit="item.limit"
                            />
                    </div>
                </div>
                
            </div>
        </div>
    </div>
</template>

<style scoped>

h1 {
    font-weight: 400;
}

.wrapper {
    padding-inline: 5%;
    color: #333338;
    padding-bottom: 35px;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.main-chart{
    background-color: #ededed;
    padding: 20px;
    margin-top: 25px;
    font-size: 1.2rem;
    font-weight: 500;
    border-radius: 4px;
}


.expense-profit-container{
    display: flex;
    gap: 15px;
    justify-content: space-between;
    margin-top: 25px;
}

.expense-profit-container > div{
    background-color: #ededed;
    flex: 1;
    border-radius: 4px;
    padding: 20px;
    font-size: 1.2rem;
    font-weight: 500;
}

.piechart-container{
    display: flexbox;
}

.chart-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

@media (max-width: 1024px) {
    .expense-profit-container {
        display: block;
    }
}
</style>
