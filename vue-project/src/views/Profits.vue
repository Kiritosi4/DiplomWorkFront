<script setup>
import Header from '../components/Header.vue';
import TargetProgressRow from '@/components/TargetProgressRow.vue';
import StatiscticCards from '../components/StatiscticCards.vue';
import { reactive, ref, computed, unref } from 'vue';
import * as dateCalc from '@/api/dateCalculator';
import OperationRow from '@/components/OperationRow.vue';
import * as api from '@/api/api';
import { ElMessage, ElMessageBox  } from 'element-plus'


const pickedPeriod = ref([dateCalc.getStartOfMonth(), dateCalc.getEndOfDay()])

const defaultTime = ref([
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59),
])

const getMinPickedTimestampSec = () => pickedPeriod.value === null ? 0 : dateCalc.milisToSec(pickedPeriod.value[0].valueOf())
const getMaxPickedTimestampSec = () => pickedPeriod.value === null ? 0 : dateCalc.milisToSec(pickedPeriod.value[1].valueOf())

const onPeriodChanged  = () => {
    clearOperationList()
    loadCategories()
    loadOperations()
    refreshCharts()
}

// === Общая статистика ===
const profitsSum = ref(0.0)
const profitsSumDiff = ref(0.0)
const operationAmount = ref(0)
const operationAmountDiff = ref(0.0)
const summaryAmount = ref(0.0)
// ===

// === Категории ===
const categories = reactive({
    null: {
        id: null,
        name: "Прочее",
        ownerId: null
    }
}) // Словарь категорий

const selected_categories = ref([])
const is_adding_category = ref(true)
const categoryFormOpened = ref(false)
const currCategoryName = ref('')
const editingCategoryId = ref("")

const categories_selector_options = computed(() => {
    return Object.keys(categories).map(key => ({
        value: key,
        label: categories[key]["name"],
        ownerId: categories[key]["ownerID"]
    }));
});

let categoriesOffset = 0
const categoriesLimit = 100
let totalCategories = 1000

const loadCategories = () => {
    if(Object.keys(categories).length >= totalCategories){
        return
    }

    api.getProfitCategories(categoriesOffset, categoriesLimit)
    .then((response) => {
        totalCategories = response.total

        response.data.forEach(category => {
            categories[category["id"]] = category
        });

        categoriesOffset += categoriesLimit
    })
}

const onCategoryFilterChanged = () => {
    clearOperationList()
    loadOperations()
    refreshCharts()
}

const openCategoryEditForm = (categoryId, categoryName) => {
    clearAddCategoryTab()
    editingCategoryId.value = categoryId
    currCategoryName.value = categoryName
    is_adding_category.value = false
    categoryFormOpened.value = true
}

const editCategory = () => {
    if (currCategoryName.value) {
        api.editProfitCategory(editingCategoryId.value, currCategoryName.value)
        .then(() => {
            console.log(currCategoryName.value)
            categories[editingCategoryId.value]["name"] = currCategoryName.value.slice()
            ElMessage.success("Категория изменена.")
            clearAddCategoryTab()
        })
    }
}

const deleteCategory = () => {
    api.deleteProfitCategory(editingCategoryId.value)
    .then(() => {
        delete categories[editingCategoryId.value]
        profits.value.map(profit => {
            if(profit.categoryId === editingCategoryId.value){
                profit.categoryId = null
            }
            return profit
        })

        refreshCharts()
        ElMessage.success("Категория удалена.")   
    })
    clearAddCategoryTab()
}

const openCategoryAddForm = () => {
    clearAddCategoryTab()
    is_adding_category.value = true
    currCategoryName.value = ""
    categoryFormOpened.value = true
}

const onAddCategory = () => {
    if (currCategoryName.value) {
        api.addProfitCategory(currCategoryName.value)
        .then((response) => {
            categories[response["id"]] = response
            ElMessage.success("Новая категория добавлена.")
        })
        clearAddCategoryTab()
    }
}

const clearAddCategoryTab = () => {
    currCategoryName.value = ''
    categoryFormOpened.value = false
}

const handleCategoryDropdownVisible = (visible) => {
    const dropdowns = document.querySelectorAll('.el-select-dropdown__list');
    dropdowns.forEach(dropdown => {
        if (visible) {
            if (dropdown) {
                dropdown.addEventListener('scroll', handleCategoriesScroll);
            }
        } else {
            const dropdown = document.querySelector('.el-select-dropdown__list');
            if (dropdown) {
                dropdown.removeEventListener('scroll', handleCategoriesScroll);
            }
        }
    })
}

const handleCategoriesScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollTop + clientHeight >= scrollHeight) {
        loadCategories()
    }
}
// ======

// === ЦЕЛИ ===
const targets = reactive({})

const sortedTargets = computed(() => {
    return Object.values(targets).sort((a, b) => b.amount / b.limit - a.amount / a.limit);
});

let targetsListOffset = 0
const targetsListLimit = 50
let totalTargets = 1000

const selected_target_filter = ref("opened")
const target_filter_options = [
    {
        value: "opened",
        label: "Недостигнутые"
    },
    {
        value: "closed",
        label: "Достигнутые"
    },
]
const onTargetFilterChanged = () => {
    targetsListOffset = 0
    totalTargets = 1000
    Object.keys(targets).forEach(key => {
       delete targets[key];
    });
    loadTargets()
}

const loadTargets = () => {
    if(Object.keys(targets).length >= totalTargets){
        return
    }

    api.getTargets(
        targetsListOffset, 
        targetsListLimit,
        selected_target_filter.value
    )
    .then((response) => {
        totalTargets = response.total
        response.data.forEach(target => {
            targets[target.id] = target
        })
    })

    targetsListOffset += targetsListLimit
}

const targetFormVisible = ref(false)
const hasEditingTarget = ref(false)
const editingTargetId = ref('')

const getTargetFormTitle = () => {
    return hasEditingTarget.value ? "Редактирование цели" : "Добавление цели"
}

const targetFormBody = reactive({
    "name": "",
    "limit": 0.01,
    "amount": 0,
    "closed": false
})

const callEditTargetTab = (target) => {
    targetFormBody.name = target.name
    targetFormBody.amount = target.amount
    targetFormBody.limit = target.limit

    editingTargetId.value = target.id

    hasEditingTarget.value = true
    targetFormVisible.value = true
}

const changeTargetState = () => {
    targetFormBody.closed = !targetFormBody.closed

    api.editTargets(editingTargetId.value, targetFormBody).then((response) => {
        clearTargetForm()
        delete targets[response.id]
        
        const msg = targetFormBody.closed ? "Цель помечена как достигнутая." : "Цель помечена как недостигнутая."
        ElMessage.success(msg)
    })
}

const editTarget = () => {
    api.editTargets(editingTargetId.value, targetFormBody)
    .then((response) => {
        targets[response.id] = response

        ElMessage.success("Цель изменена.")
        clearTargetForm()
    })
}

const deleteTarget = () => {
    api.deleteTarget(editingTargetId.value)
    .then(() => {
        delete targets[editingTargetId.value]

        // Очистка у связанных доходов айди удаленной цели
        profits.value.forEach(profit => {
            if(profit.targetId === editingTargetId.value){
                profit.targetId = null
            }
        })

        ElMessage.success("Цель удалена.")
        clearTargetForm()
    })
}

const callTargetForm = () => {
    hasEditingTarget.value = false
    clearTargetForm()
    targetFormVisible.value = true
}

const addTarget = () => {
    api.addTarget(targetFormBody)
    .then((response) => {
        targets[response.id] = response

        ElMessage.success("Новая цель создана")
        clearTargetForm()
    })
}

const clearTargetForm = () => {
    targetFormVisible.value = false
    targetFormBody.amount = 0,
    targetFormBody.limit = 0.01,
    targetFormBody.name = ""
}

const addToTargetSum = ref(100)
const addSumToTarget = () => {
    const closedTarget = targets[editingTargetId.value]
    const sumBody = {
        "name": closedTarget.name,
        "limit": closedTarget.limit,
        "amount": Number(closedTarget.amount + addToTargetSum.value).toFixed(2),
        "closed": closedTarget.closed
    }

    api.editTargets(editingTargetId.value, sumBody)
    .then((response) => {
        targets[response.id] = response
        targetFormBody.amount += addToTargetSum.value
        ElMessage.success(`${addToTargetSum.value} ₽ добавлено к цели.`)
    })
}

/*
const targetsListForDropdown = computed(() => {
    let editingProfit = undefined
    if(hasEditingProfit.value){
        const profitIndex = profits.value.findIndex(profit => profit.id === editingOperationId)
        editingProfit = profits.value[profitIndex]
    }
    
    let val = Object.values(targets).map(target => ({
        label: target.name,
        value: target.id,
        amount: target.amount,
        limit: target.limit,
        disabled: target.amount >= target.limit && (editingProfit === undefined || editingProfit.targetId !== target.id)
    }))
    val.unshift({
        label: "Без цели",
        value: null,
    })
    return val
});
*/

// === Доходы ===
const profits = ref([])

const sortedProfits = computed(() => {
    const sortKey = selected_profits_sort.value["orderBy"]
    return profits.value.slice().sort((a,b) => selected_profits_sort.value["order"] === "asc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])
});

const sortProfits = () => {
    const sortKey = selected_profits_sort.value["orderBy"]
    profits.value.sort((a,b) => selected_profits_sort.value["order"] === "asc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])
}


let profitsListOffset = 0
const profitsListLimit = 50
let totalProfits = 1000

const loadOperations = () => {
    if(profits.value.length >= totalProfits){
        return
    }

    api.getProfits(
        profitsListOffset, 
        profitsListLimit, 
        selected_profits_sort.value["orderBy"], 
        selected_profits_sort.value["order"], 
        getMinPickedTimestampSec(),
        getMaxPickedTimestampSec(),
        selected_categories.value
    )
    .then((response => {
        totalProfits = response.total

        response.data.forEach(profit => {
            profits.value.push(profit)
        })

        response.categories.forEach(category => {
            categories[category["id"]] = category
        });
    }))

    profitsListOffset += profitsListLimit
}

const clearOperationList = () => 
{
    profitsListOffset = 0
    totalProfits = 1000
    profits.value = []
}

const selected_profits_sort = ref({
    order: "desc",
    orderBy: "CreatedAt"
})

const profits_sort_options = [
    {
        value: {
            order: "desc",
            orderBy: "CreatedAt"
        },
        label: "Сначала новые"
    },
    {
        value: {
            order: "asc",
            orderBy: "CreatedAt"
        },
        label: "Сначала старые"
    },
    {
        value: {
            order: "desc",
            orderBy: "Amount"
        },
        label: "Сначала дорогие"
    },
    {
        value: {
            order: "asc",
            orderBy: "Amount"
        },
        label: "Сначала дешевые"
    },
]

const onProfitsSortChanged = () => {
    clearOperationList()
    loadOperations()
}

const profitFormVisible = ref(false)
const hasEditingProfit = ref(false)
let editingOperationId = ''

const getEditingOperation = () => {
    const profitIndex = profits.value.findIndex(profit => profit.id === editingOperationId)
    return profits.value[profitIndex]
}

const getMaxProfitAmount = () => {
    let maxAmount = 100000000000000;
    /*
    if(profitFormBody.targetId !== null && profitFormBody.targetId !== ''){
        const diff = targets[profitFormBody.targetId].limit - targets[profitFormBody.targetId].amount
        if(hasEditingProfit.value){
            const profitIndex = profits.value.findIndex(profit => profit.id === editingOperationId)
            const editingProfit =  profits.value[profitIndex]
            if(editingProfit !== undefined){
                maxAmount = editingProfit.amount + diff
            }
        }else{
            maxAmount = diff
        }
    }*/

    return Number(maxAmount.toFixed(2));
}

const onTargetChanged = (val) => {
    const selectedTarget = targets[val]

    let amountToAdd = profitFormBody.amount
    let offset = 0
    if(hasEditingProfit){
        const editingProfit = getEditingOperation()
        if(editingProfit.targetId === val){
            amountToAdd = profitFormBody.amount - editingProfit.amount
            offset = editingProfit.amount
        }
    }

    if(selectedTarget !== undefined && amountToAdd > selectedTarget.limit - selectedTarget.amount){
        let remainingAmount = selectedTarget.limit - selectedTarget.amount + offset
        profitFormBody.amount = Number(remainingAmount.toFixed(2))
    }
}

const getOperationFormTitle = () => {
    return hasEditingProfit.value ? "Редактирование дохода" : "Добавление дохода"
}

const profitFormBody = reactive({
    "categoryId": null,
    "amount": 0,
    "timestamp": 0
})

const callEditOperationTab = (profit) => {
    profitFormBody.amount = profit.amount
    profitFormBody.categoryId = profit.categoryId
    profitFormBody.timestamp = profit.createdAt * 1000

    editingOperationId = profit.id

    hasEditingProfit.value = true
    profitFormVisible.value = true
}

const editOperation = () => {
    const profitIndex = profits.value.findIndex(profit => profit.id === editingOperationId);
    const editedProfit =  profits.value[profitIndex] 

    api.editProfit(editingOperationId, profitFormBody)
    .then(() => {
        const amountDiff = editedProfit.amount - profitFormBody.amount
        summaryAmount.value -= amountDiff

        clearOperationList()
        loadOperations()
        refreshCharts()

        ElMessage.success("Запись о доходе изменена.")
        clearAddOperationForm()
    })
}

const deleteOperation = () => {
    api.deleteProfit(editingOperationId)
    .then(() => {
        const index = profits.value.findIndex(profit => profit.id === editingOperationId);
        const deletedProfit = profits.value[index]

        summaryAmount.value -= deletedProfit.amount

        profits.value.splice(index, 1)
        refreshCharts()
        ElMessage.success("Запись о доходе удалена.")
        clearAddOperationForm()
    })
}

const callAddOperationForm = () => {
    hasEditingProfit.value = false
    clearAddOperationForm()
    profitFormVisible.value = true
}

const addOperation = () => {
    profitFormBody.timestamp = dateCalc.milisToSec(profitFormBody.timestamp)
    api.addProfit(profitFormBody)
    .then((response) => {
        clearOperationList()
        loadOperations()
        summaryAmount.value += profitFormBody.amount

        ElMessage.success("Новая запись о доходе добавлена.")
        clearAddOperationForm()
        refreshCharts()
    })
}

const clearAddOperationForm = () => {
    profitFormVisible.value = false
    profitFormBody.categoryId = "",
    profitFormBody.amount = 0,
    profitFormBody.timestamp = Date.now()
    profitFormBody.targetId = ""
}
// ======

// === Графики ===
const mainchart_options = {}
const mainchart_series = ref([{
    name: "sales",
    data: [
        {
            x: '01.01.2024',
            y: 400
        },
        {
            x: '02.01.2024',
            y: 600
        },
    ]
}])

const piechartSeries = ref([])
const piechartLabels = ref([])

const piechartOptions = computed(() => {
    return {
        chart: {
            type: 'donut',
            height: '300'
        },
        labels: piechartLabels.value.map(categoryId => {
            const fixedcategoryId = categoryId === "00000000-0000-0000-0000-000000000000" ? null : categoryId
            return categories[fixedcategoryId].name || "Прочее"
        }),
        responsive: [{
            breakpoint: 1280,
            options: {
            legend: {
                position: 'bottom'
            }
            }
        }],
        noData: {
            text: 'Недостаточно данных',
            align: 'center',
            verticalAlign: 'middle',
            style: {
                color: "rgba(51,51,56,0.5)",
                fontSize: '1.2rem',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
            }
        }
    }
})

const refreshCharts = () => {
    api.getProfitsDashboard(
        getMinPickedTimestampSec(),
        getMaxPickedTimestampSec(),
        selected_categories.value
    )
    .then((response => {
        mainchart_series.value[0].data = response.chartData

        response.categories.forEach(category => {
            categories[category["id"]] = category
        });

        piechartSeries.value = Object.values(response.pieChartData)
        piechartLabels.value = Object.keys(response.pieChartData)

        profitsSum.value = response.totalAmount
        /*
        if(response.lastTotalAmount != 0){
            profitsSumDiff.value = profitsSum.value / response.lastTotalAmount * 100
            profitsSumDiff.value = Number(profitsSumDiff.value.toFixed(2));
        }else{
            profitsSumDiff.value = 0.0
        }
        */
       
        operationAmount.value = response.totalOperations
        /*
        if(response.lastTotalOperations != 0){
            operationAmountDiff.value = operationAmount.value / response.lastTotalOperations * 100
            operationAmountDiff.value = Number(operationAmountDiff.value.toFixed(2));
        }else{
            operationAmountDiff.value = 0.0
        }
        */
    }))
}
// ======

// === Bootstrap ===
loadCategories()
loadOperations()
loadTargets()
refreshCharts()

api.getSummaryAmount()
    .then((response => {
        summaryAmount.value = response
    }))
//======
</script>

<template>
    <Header :activeTab="2" />
    <div class = "content">
        <div class = "wrapper">
            <div class="toolbar">
                <h1>Цели и доходы</h1>
                <div class="toolbar-tools">
                    <el-button type="primary" @click="callAddOperationForm">
                        <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                        </svg>
                        Добавить доход
                    </el-button>
                    <el-select-v2
                    v-model="selected_categories"
                    :options="categories_selector_options"
                    placeholder="Все категории"
                    style="min-width: 150px; vertical-align: middle; max-width: 240px"
                    multiple
                    clearable
                    collapse-tags
                    @change="onCategoryFilterChanged()"
                    @visible-change="handleCategoryDropdownVisible"
                    >
                        <template #default="{ item }">
                            <el-button v-if="item.ownerId" circle @click="openCategoryEditForm(item.value, item.label)" style="max-width: 25px; max-height: 25px; border: none; position: absolute;" @click.stop>
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
                                </svg>
                            </el-button> 
                            <span style="margin-left: 30px; text-align: center;">{{ item.label }}</span>
                        </template>
                        <template #footer>
                            <el-button v-if="!categoryFormOpened" bg size="small" @click="openCategoryAddForm" type="primary">
                                Добавить
                            </el-button>
                            <div v-else class="select-footer">
                                <el-input
                                v-model="currCategoryName"
                                class="option-input"
                                placeholder="Название"
                                size="small"
                                maxlength="20"
                                minlength="1"
                                show-word-limit
                                />
                                <div style="padding-top: 5px;">
                                    <el-button v-if="is_adding_category" type="primary" size="small" @click="onAddCategory">Добавить</el-button>
                                    <div v-else>
                                        <el-button type="primary" size="small" @click="editCategory">Изменить</el-button>
                                        <el-button type="danger" size="small" @click="deleteCategory">Удалить</el-button>
                                    </div>
                                    
                                    <el-button size="small" @click="clearAddCategoryTab">Отмена</el-button>
                                </div>
                            </div>
                        </template>
                    </el-select-v2>
                    <el-date-picker
                        v-model="pickedPeriod"
                        type="daterange"
                        unlink-panels
                        range-separator="-"
                        :default-time="defaultTime"
                        start-placeholder="От"
                        end-placeholder="До"
                        :shortcuts="dateCalc.calendarShortcuts"
                        @change="onPeriodChanged()"
                        style="max-width: 400px; min-width: 250px;"
                    />
                </div>
            </div>
            
            <div class="main-stats">
                <StatiscticCards  
                first-title="💸 Доходы за период"
                :first-digit="profitsSum"
                :first-digit-diff="profitsSumDiff"
                sec-title="📑 Количество доходов"
                :sec-digit="operationAmount"
                :sec-digit-diff="operationAmountDiff"
                third-title="💰 Разница доходов и расходов"
                :third-digit="summaryAmount"
                first-postfix="₽"
                third-postfix="₽"
                />
            </div>

            <div class = "main-container">
                <div class="targets-container grid-chain grid2">
                    <div class="targets-list-toolbar">
                        🎯 Список целей

                        <div style="display: flex; gap: 15px;">
                            <el-button type="primary" style="padding-left: 5px;" @click="callTargetForm">
                            <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                            </svg>
                            Добавить цель
                            </el-button>
                            <el-select-v2
                                v-model="selected_target_filter"
                                :options="target_filter_options"
                                placeholder="Недостигнутые"
                                style="vertical-align: middle; max-width: 150px; width: 150px; font-weight: 400;"
                                @change="onTargetFilterChanged()"
                            />
                        </div>
                        
                    </div>
                    <div v-if="Object.keys(targets).length > 0" class="chart-list" v-infinite-scroll="loadTargets" style="overflow: auto; overflow-x: hidden;">
                        <TargetProgressRow 
                            v-for="item in sortedTargets"
                            :key="item.name"
                            :title="item.name"
                            :amount="item.amount"
                            :limit="item.limit"
                            @click="callEditTargetTab(item)"
                            />
                    </div>
                    <div v-else style="text-align: center; align-items: center; position: relative; top: 40%;">
                        <span style="opacity: 50%;">Нет заданных целей</span>
                    </div>
                </div>
                <div class="right-side grid4">
                    <div class="profits-container">
                        <div class="profits-container-toolbar">
                            📋 Доходы
                            <el-select-v2
                            v-model="selected_profits_sort"
                            :options="profits_sort_options"
                            placeholder="Сортировка"
                            style="vertical-align: middle; max-width: 180px; width: 180px; font-weight: 400;"
                            @change="onProfitsSortChanged()"
                            />
                        </div>
                        
                        <div class="operation-list" v-infinite-scroll="loadOperations" style="overflow: auto">
                            <OperationRow 
                                v-for="item in profits"
                                :key="item.id"
                                :category="categories[item.categoryId].name || 'Прочее'"
                                :amount="item.amount"
                                :date="new Date(item.createdAt * 1000).toLocaleString()"
                                @click="callEditOperationTab(item)"
                                profit
                                />
                        </div>
                        <div v-if="profits.length == 0" style="text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; position: relative; top: 40%;">
                            <span style="opacity: 50%;">Нет записей</span>
                            <el-button type="primary" @click="callAddOperationForm" style="padding-left: 5px;">
                                <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                                </svg>
                                Добавить
                            </el-button>
                        </div>
                    </div> 
                </div>
                <div class="profits-piechart-container grid-chain grid3">
                    📊 Структура доходов
                    <div class="pie-chart">
                        <apexchart type="donut" :series="piechartSeries" :options="piechartOptions"></apexchart>
                    </div>
                </div>
                <div class = "main-chart grid1">
                    📊 График доходов
                    <apexchart height="300" type="bar" :options="mainchart_options" :series="mainchart_series"></apexchart>
                </div>
            </div>
        </div>
    </div>

    <!-- ДОХОДЫ -->
    <el-dialog v-model="profitFormVisible" :title="getOperationFormTitle()" @close="clearAddOperationForm" style="width: 90%; max-width: 500px;">
        <el-form :model="profitFormBody" label-width="auto" >
            <el-form-item label="Сумма">
                <el-input-number 
                v-model="profitFormBody.amount" 
                :min="0.01"
                :precision="2"
                :max="getMaxProfitAmount()"
                style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
            <el-form-item label="Время">
                <el-date-picker
                v-model="profitFormBody.timestamp" 
                type="datetime"
                placeholder="Выберите время"
                format="DD.MM.YYYY, HH:mm"
                value-format="x"
                style="width: 100%;"
                :clearable="false"
                />
            </el-form-item>
            <el-form-item label="Категория">
                <el-select-v2
                    v-model="profitFormBody.categoryId"
                    :options="categories_selector_options"
                    placeholder="Прочее"
                    style="min-width: 150px; margin-right: 16px; vertical-align: middle;"
                    @visible-change="handleCategoryDropdownVisible"
                    >
                        <template #default="{ item }">
                            <el-button v-if="item.ownerId" circle @click="openCategoryEditForm(item.value, item.label)" style="max-width: 25px; max-height: 25px; border: none; position: absolute;" @click.stop>
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
                                </svg>
                            </el-button> 
                            <span style="margin-left: 30px; text-align: center;">{{ item.label }}</span>
                        </template>
                        <template #footer>
                            <el-button v-if="!categoryFormOpened" bg size="small" @click="openCategoryAddForm" type="primary">
                                Добавить
                            </el-button>
                            <div v-else class="select-footer">
                                <el-input
                                v-model="currCategoryName"
                                class="option-input"
                                placeholder="Название"
                                size="small"
                                maxlength="20"
                                minlength="1"
                                show-word-limit
                                />
                                <div style="padding-top: 5px;">
                                    <el-button v-if="is_adding_category" type="primary" size="small" @click="onAddCategory">Добавить</el-button>
                                    <div v-else>
                                        <el-button type="warning" size="small" @click="editCategory">Изменить</el-button>
                                        <el-button type="danger" size="small" @click="deleteCategory">Удалить</el-button>
                                    </div>
                                    
                                    <el-button size="small" @click="clearAddCategoryTab">Отмена</el-button>
                                </div>
                            </div>
                        </template>
                    </el-select-v2>
            </el-form-item>
        </el-form>
        <template #footer>
        <div class="dialog-footer">
            <el-button @click="clearAddOperationForm">Отмена</el-button>
            <div v-if="hasEditingProfit">
                <el-button type="danger" @click="deleteOperation">Удалить</el-button>
                <el-button type="warning" @click="editOperation">Изменить</el-button>
            </div>
            <el-button v-else type="primary" @click="addOperation">Добавить</el-button>
        </div>
        </template>
    </el-dialog>

    <!-- ЦЕЛЬ -->
    <el-dialog v-model="targetFormVisible" :title="getTargetFormTitle()"  style="width: 90%; max-width: 600px;" @close="clearTargetForm">
        <el-form :model="targetFormBody" label-width="auto" >
            <el-form-item label="Название">
                <el-input v-model="targetFormBody.name" :min="0.01" style="width: 100%;" maxlength="32" show-word-limit minlength="1"/>
            </el-form-item>
            <el-form-item label="Прогресс" v-if="hasEditingTarget">

                <el-progress 
                :percentage="Math.floor((targetFormBody.amount / targetFormBody.limit) * 100)" 
                :color="[
                    { color: '#f56c6c', percentage: 50 },
                    { color: '#1989fa', percentage: 75 },
                    { color: '#00e396', percentage: 100 },
                ]" 
                :stroke-width="8"
                style="width: 100%;"
                />
                <span style="height: 25px; margin-inline: auto;">{{ Math.max(0, Number( targetFormBody.limit - targetFormBody.amount).toFixed(2))  }} ₽ осталось</span>
            </el-form-item>
            <el-form-item label="Накоплено">
                <el-input-number 
                v-model="targetFormBody.amount" 
                :min="0"
                :precision="2"
                :max="100000000000000"
                style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
            <el-form-item label="Лимит">
                <el-input-number 
                v-model="targetFormBody.limit" 
                :min="0.01"
                :precision="2"
                :max="100000000000000"
                style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="clearTargetForm">Отмена</el-button>
                <div v-if="hasEditingTarget">
                    <el-button type="danger" @click="deleteTarget">Удалить</el-button>
                    <el-button type="warning" @click="editTarget">Изменить</el-button>
                    <el-button type="primary" @click="changeTargetState" class="target-state-btn">{{ targetFormBody.closed ? 'Отметить как недостигнутую' : 'Отметить как достигнутую' }}  </el-button>
                </div>
                <el-button v-else type="primary" @click="addTarget">Добавить</el-button>
            </div>
            <div v-if="hasEditingTarget" style="padding-top: 15px; border-top: 1px solid rgb(220, 223, 230); margin-top: 15px;">
                <div style="width: 100%; display: flex; flex-direction: column; gap: 15px;">
                    <el-input-number 
                    v-model="addToTargetSum"
                    :min="0.01"
                    :precision="2"
                    :max="100000000000000"
                    style="width: 100%;"
                    >
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
                <el-button type="primary" @click="addSumToTarget">Добавить сумму</el-button>
                </div>
            </div>
        </template>
    </el-dialog>

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
    font-size: 1.2rem;
    font-weight: 500;
    border-radius: 4px;
    flex-basis: 50%;
}

.left-side {
    flex-basis: 80%;
    flex-direction: column;
    gap: 15px;
    display: flex;
}

.right-side {
    display: flex;
}

.right-side > div {
    background-color: #ededed;
    padding: 20px;
    font-size: 1.2rem;
    font-weight: 500;
    border-radius: 4px;
    width: 100%;
}

.profit-profit-container{
    display: flex;
    gap: 15px;
}

.main-container{
    display: grid;
    grid-template-columns: repeat(2, 2fr) 1fr;
    grid-template-rows: repeat(2, 1fr);
    grid-column-gap: 15px;
    grid-row-gap: 15px;
    margin-top: 15px;
}

.main-container > *{
    box-sizing: border-box;
    max-width: 96vw;
}

.grid1 { grid-area: 2 / 1 / 3 / 3; }
.grid2 { grid-area: 1 / 1 / 2 / 2; }
.grid3 { grid-area: 1 / 2 / 2 / 3; }
.grid4 { grid-area: 1 / 3 / 3 / 4; }

.grid-chain{
    background-color: #ededed;
    flex: 1;
    border-radius: 4px;
    padding: 20px;
    font-size: 1.2rem;
    font-weight: 500;
}

.chart-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 295px;
}

.operation-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    max-height: 765px;
    list-style: none;
    color: #333338;
    max-height: 660px;
}

.toolbar-tools{
    display: flex;
    align-items: flex-end;
    gap: 15px
}

.profits-container-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.toolbar-tools > .el-button {
    padding-block: 8px;
    padding-left: 5px;
}

.targets-list-toolbar {
    display: flex;
    gap: 15px;
    flex-direction: row;
    justify-content: space-between;
}

@media (max-width: 1390px) {
    .targets-list-toolbar {
        flex-direction: column;
    }
}

@media (max-width: 1200px) {
    .wrapper {
        padding-inline: 2%;
    }
}

@media (max-width: 1024px) {
    .profit-profit-container {
        display: block;
    }

    .toolbar {
        flex-direction: column;
        align-items: start;
        padding-bottom: 15px;
    }

    .main-container{
        grid-template-columns: 1fr;
        grid-template-rows: repeat(4, 1fr);
    }

    .grid1 { grid-area: auto; }
    .grid2 { grid-area: auto; }
    .grid3 { grid-area: auto; }
    .grid4 { grid-area: auto; }

    .operation-list {
        max-height: 295px;
    }

    .targets-list-toolbar {
        flex-direction: row;
    }

    .toolbar-tools{
        flex-wrap: wrap;
    }
}

@media (max-width: 600px) {
    .targets-list-toolbar {
        flex-direction: column;
    }

    .target-state-btn{
        margin-top: 10px;
    }
}
</style>
