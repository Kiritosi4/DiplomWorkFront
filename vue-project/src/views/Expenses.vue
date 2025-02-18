<script setup>
import Header from '../components/Header.vue';
import ProgressRow from '@/components/ProgressRow.vue';
import StatiscticCards from '../components/StatiscticCards.vue';
import { reactive, ref, computed, unref } from 'vue';
import * as dateCalc from '@/api/dateCalculator';
import OperationRow from '@/components/OperationRow.vue';
import * as api from '@/api/api';
import { ElMessage } from 'element-plus'


const pickedPeriod = ref([dateCalc.getStartOfMonth(), dateCalc.getEndOfDay()])

const getMinPickedTimestampSec = () => dateCalc.milisToSec(pickedPeriod.value[0].valueOf())
const getMaxPickedTimestampSec = () => dateCalc.milisToSec(pickedPeriod.value[1].valueOf())

const onPeriodChanged  = () => {
    clearOperationList()
    loadCategories()
    loadOperations()
}

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

    api.getExpenseCategories(categoriesOffset, categoriesLimit)
    .then((response) => {
        totalCategories = response.total

        response.data.forEach(category => {
            categories[category["id"]] = category
        });

        categoriesOffset += categoriesLimit
    })
}

const onCategoryFilterChanged = () => {
    console.log("Эмм")
    clearOperationList()
    loadOperations()
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
        api.editExpenseCategory(editingCategoryId.value, currCategoryName.value)
        .then(() => {
            console.log(currCategoryName.value)
            categories[editingCategoryId.value]["name"] = currCategoryName.value.slice()
            ElMessage.success("Категория изменена.")
            clearAddCategoryTab()
        })
    }
}

const deleteCategory = () => {
    api.deleteExpenseCategory(editingCategoryId.value)
    .then(() => {
        delete categories[editingCategoryId.value]
        expenses.value.map(expense => {
            if(expense.categoryId === editingCategoryId.value){
                expense.categoryId = null
            }
            return expense
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
        api.addExpenseCategory(currCategoryName.value)
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
    if (visible) {
        const dropdown = document.querySelector('.el-select-dropdown__list');
        if (dropdown) {
            dropdown.addEventListener('scroll', handleCategoriesScroll);
        }
    } else {
        const dropdown = document.querySelector('.el-select-dropdown__list');
        if (dropdown) {
            dropdown.removeEventListener('scroll', handleCategoriesScroll);
        }
    }
}

const handleCategoriesScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollTop + clientHeight >= scrollHeight) {
        loadCategories()
    }
}
// ======

// === БЮДЖЕТЫ ===
const budgets = ref([])

const sortedBudgets = computed(() => {
    return budgets.value.slice().sort((a, b) => b.amount / b.limit - a.amount / a.limit);
});

const budgetPeriodList = [
    {
        value: 0,
        label: "День"
    },
    {
        value: 1,
        label: "Неделя"
    },
    {
        value: 2,
        label: "Месяц"
    },
    {
        value: 3,
        label: "Год"
    },
]

let budgetsListOffset = 0
const budgetsListLimit = 50
let totalBudgets = 1000

const loadBudgets = () => {
    if(budgets.value.length >= totalBudgets){
        return
    }

    api.getBudgets(
        budgetsListOffset, 
        budgetsListLimit
    )
    .then((response) => {
        totalBudgets = response.total
        response.data.forEach(budget => {
            budgets.value.push(budget)
        })
    })

    budgetsListOffset += budgetsListLimit
}

const budgetFormVisible = ref(false)
const hasEditingBudget = ref(false)
const editingBudgetId = ref('')

const getBudgetFormTitle = () => {
    return hasEditingBudget.value ? "Редактирование бюджета" : "Добавление бюджета"
}

const budgetFormBody = reactive({
    "name": "",
    "category": null,
    "limit": 0,
    "periodType": 2
})

const callEditBudgetTab = (budget) => {
    budgetFormBody.name = budget.name
    budgetFormBody.category = budget.category
    budgetFormBody.limit = budget.limit
    budgetFormBody.periodType = budget.periodType

    editingBudgetId.value = budget.id

    hasEditingBudget.value = true
    budgetFormVisible.value = true

    loadBudgetExpenses()
}

const editBudget = () => {
    api.editBudget(editingBudgetId.value, budgetFormBody)
    .then((response) => {
        let index = budgets.value.findIndex(budget => budget.id === editingBudgetId.value);
        budgets.value[index] = response

        ElMessage.success("Бюджет изменен.")
        clearBudgetForm()
    })
}

const deleteBudget = () => {
    api.deleteBudget(editingBudgetId.value)
    .then(() => {
        let index = budgets.value.findIndex(budget => budget.id === editingBudgetId.value);
        budgets.value.splice(index, 1)

        // Очистка у связанных расходов айди удаленного бюджета
        expenses.value.forEach(expense => {
            if(expense.budgetId === editingBudgetId.value){
                expense.budgetId = null
            }
        })

        ElMessage.success("Бюджет удален.")
        clearBudgetForm()
    })
}

const callBudgetForm = () => {
    hasEditingBudget.value = false
    clearBudgetForm()
    budgetFormVisible.value = true
}

const addBudget = () => {
    api.addBudget(budgetFormBody)
    .then((response) => {
        response.amount = 0
        budgets.value.push(response);

        ElMessage.success("Новый бюджет создан")
        clearBudgetForm()
    })
}

const clearBudgetForm = () => {
    budgetFormVisible.value = false
    budgetFormBody.category = "",
    budgetFormBody.limit = 0,
    budgetFormBody.name = ""
    budgetFormBody.periodType = 2

    if(hasEditingBudget){
        const filteredExpenses =  expenses.value.filter(item => 
            item.createdAt > dateCalc.milisToSec(pickedPeriod.value[0].valueOf()) && item.createdAt < dateCalc.milisToSec(pickedPeriod.value[1].valueOf())
        )

        expenses.value = filteredExpenses

        budgetExpensesListOffset = 0
        totalBudgetExpenses = 1000
    }
}

const budgetsListForDropdown = computed(() => {
    return budgets.value.map(budget => ({
        label: budget.name,
        value: budget.id,
        amount: budget.amount,
        limit: budget.limit,
    }));
});

// = Расходы бюджета =
const budgetExpenses = computed(() => {
    return expenses.value.filter(item => 
        item.budgetId === editingBudgetId.value
    )
});

let budgetExpensesListOffset = 0
const budgetExpensesListLimit = 10
let totalBudgetExpenses = 1000

const loadBudgetExpenses = () => {
    if(budgetExpenses.value.length >= totalBudgetExpenses){
        return
    }

    api.getBudgetExpenses(
        editingBudgetId.value,
        budgetExpensesListOffset,
        budgetExpensesListLimit
    )
    .then((response => {
        totalBudgetExpenses = response.total
        
        const oldExpenseIds = new Set(expenses.value.map(expense => expense.id));

        response.data.forEach(expense => {
            // Добавление только новых записей
            if(!oldExpenseIds.has(expense.id)){
                expenses.value.push(expense)
            }
        })

        response.categories.forEach(category => {
            categories[category["id"]] = category
        });
    }))

    expensesListOffset += expensesListLimit
}
// ==
// ======

// === Расходы ===
const expenses = ref([])

const sortedExpenses = computed(() => {
    const sortKey = selected_expenses_sort.value["orderBy"]
    return expenses.value.slice().sort((a,b) => selected_expenses_sort.value["order"] === "asc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])
});

const sortExpenses = () => {
    const sortKey = selected_expenses_sort.value["orderBy"]
    expenses.value.sort((a,b) => selected_expenses_sort.value["order"] === "asc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])
}


let expensesListOffset = 0
const expensesListLimit = 50
let totalExpenses = 1000

const loadOperations = () => {
    if(expenses.value.length >= totalExpenses){
        return
    }

    api.getExpenses(
        expensesListOffset, 
        expensesListLimit, 
        selected_expenses_sort.value["orderBy"], 
        selected_expenses_sort.value["order"], 
        getMinPickedTimestampSec(),
        getMaxPickedTimestampSec(),
        selected_categories.value
    )
    .then((response => {
        totalExpenses = response.total

        response.data.forEach(expense => {
            expenses.value.push(expense)
        })

        response.categories.forEach(category => {
            categories[category["id"]] = category
        });
    }))

    expensesListOffset += expensesListLimit
}

const clearOperationList = () => 
{
    expensesListOffset = 0
    totalExpenses = 1000
    expenses.value = []
}

const selected_expenses_sort = ref({
    order: "desc",
    orderBy: "CreatedAt"
})

const expenses_sort_options = [
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

const onExpensesSortChanged = () => {
    clearOperationList()
    loadOperations()
}

const expenseFormVisible = ref(false)
const hasEditingExpense = ref(false)
let editingOperationId = ''

const getOperationFormTitle = () => {
    return hasEditingExpense.value ? "Редактирование расхода" : "Добавление расхода"
}

const expenseFormBody = reactive({
    "categoryId": null,
    "amount": 0,
    "timestamp": 0,
    "budgetId": null
})

const callEditOperationTab = (expense) => {
    expenseFormBody.amount = expense.amount
    expenseFormBody.categoryId = expense.categoryId
    expenseFormBody.timestamp = expense.createdAt * 1000
    expenseFormBody.budgetId = expense.budgetId

    editingOperationId = expense.id

    hasEditingExpense.value = true
    expenseFormVisible.value = true
}

const editOperation = () => {
    api.editExpense(editingOperationId, expenseFormBody)
    .then(() => {
        let expenseIndex = expenses.value.findIndex(expense => expense.id === editingOperationId);
        let editedExpense =  expenses.value[expenseIndex] 

        //Изменение связанного бюджета
        if(editedExpense.budgetId === expenseFormBody.budgetId) {
            const amountDiff = editedExpense.amount - expenseFormBody.amount
            if(amountDiff != 0){
                let budgetIndex = budgets.value.findIndex(budget => budget.id === expenseFormBody.budgetId);
                if(budgetIndex !== -1){
                    budgets.value[budgetIndex].amount -= amountDiff
                }
            }
        }else{
            if(editedExpense.budgetId){
                let oldBudgetIndex = budgets.value.findIndex(budget => budget.id === editedExpense.budgetId);
                if(oldBudgetIndex !== -1){
                    budgets.value[oldBudgetIndex].amount -= editedExpense.amount
                }
            }

            let newBudgetIndex = budgets.value.findIndex(budget => budget.id === expenseFormBody.budgetId);
            if(newBudgetIndex !== -1){
                budgets.value[newBudgetIndex].amount += expenseFormBody.amount
            }
        }
        
        /*
        // Првоерка что изменения вписываются в период
        if(getMinPickedTimestampSec() < expenseFormBody.timestamp && expenseFormBody.timestamp < getMaxPickedTimestampSec()){
            editedExpense.amount = expenseFormBody.amount
            editedExpense.categoryId = expenseFormBody.categoryId
            editedExpense.createdAt = expenseFormBody.timestamp
            editedExpense.budgetId = expenseFormBody.budgetId
        }else{
            expenses.value.splice(expenseIndex, 1)
        }
        */

        clearOperationList()
        loadOperations()
        refreshCharts()

        ElMessage.success("Запись о расходе изменена.")
        clearAddOperationForm()
    })
}

const deleteOperation = () => {
    api.deleteExpense(editingOperationId)
    .then(() => {
        const index = expenses.value.findIndex(expense => expense.id === editingOperationId);
        const deletedExpense = expenses.value[index]

        // Обновление связанного бюджета
        if(deletedExpense.budgetId){
            const budgetIndex = budgets.value.findIndex(budget => budget.id === deletedExpense.budgetId);
            budgets.value[budgetIndex].amount -= deletedExpense.amount
        }

        expenses.value.splice(index, 1)

        ElMessage.success("Запись о расходе удалена.")
        clearAddOperationForm()
    })
}

const callAddOperationForm = () => {
    hasEditingExpense.value = false
    clearAddOperationForm()
    expenseFormVisible.value = true
}

const addOperation = () => {
    expenseFormBody.timestamp = dateCalc.milisToSec(expenseFormBody.timestamp)

    api.addExpense(expenseFormBody)
    .then((response) => {
        /*
        // Добавление подходящей по периоду операции
        if(getMinPickedTimestampSec() < response.createdAt && response.createdAt < getMaxPickedTimestampSec()){
            expenses.value.push(response);
            sortExpenses()
        }
        */

        clearOperationList()
        loadOperations()

        //Изменение связанного бюджета
        if(expenseFormBody.budgetId){
            let index = budgets.value.findIndex(budget => budget.id === expenseFormBody.budgetId);

            if(index !== -1){
                let expenseBudget = budgets.value[index]
                const startPeriod = dateCalc.getMinTimestampByPeriod(expenseBudget.periodType)
                const endPeriod = dateCalc.getMaxTimestampByPeriod(expenseBudget.periodType)
                console.log(startPeriod, expenseFormBody.timestamp, endPeriod)


                if(startPeriod < expenseFormBody.timestamp && expenseFormBody.timestamp < endPeriod){
                    expenseBudget.amount += expenseFormBody.amount
                }
            }
        }

        ElMessage.success("Новая запись о расходе добавлена.")
        clearAddOperationForm()
        refreshCharts()
    })
}

const clearAddOperationForm = () => {
    expenseFormVisible.value = false
    expenseFormBody.categoryId = "",
    expenseFormBody.amount = 0,
    expenseFormBody.timestamp = Date.now()
    expenseFormBody.budgetId = ""
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
        },
        labels: piechartLabels.value.map(categoryId => {
            const fixedcategoryId = categoryId === "00000000-0000-0000-0000-000000000000" ? null : categoryId
            return categories[fixedcategoryId].name || "Прочее"
        }),
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
})

const refreshCharts = () => {
    api.getExpensesDashboard(
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

        console.log(piechartOptions.value)
        console.log(piechartLabels.value)
    }))
}
// ======

// === Bootstrap ===
loadCategories()
loadOperations()
loadBudgets()
refreshCharts()
//======
</script>

<template>
    <Header :activeTab="3" />
    <div class = "content">
        <div class = "wrapper">
            <div class="toolbar">
                <h1>Расходы</h1>
                <div class="toolbar-tools">
                    <el-button type="primary" style="margin-right: 15px; padding-left: 5px;" @click="callAddOperationForm">
                        <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                        </svg>
                        Добавить расход
                    </el-button>
                    <el-select-v2
                    v-model="selected_categories"
                    :options="categories_selector_options"
                    placeholder="Все категории"
                    style="min-width: 150px; margin-right: 16px; vertical-align: middle; max-width: 240px"
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
                        :default-time="pickedPeriod"
                        start-placeholder="От"
                        end-placeholder="До"
                        :shortcuts="dateCalc.calendarShortcuts"
                        @change="onPeriodChanged()"
                        style="max-width: 400px; min-width: 250px;"
                    />
                </div>
            </div>
            
            <div class="main-stats">
                <StatiscticCards/>
            </div>

            <div class = "main-container">
                <div class="left-side">
                    <div class = "main-chart">
                        График расходов
                        <apexchart height="300" type="bar" :options="mainchart_options" :series="mainchart_series"></apexchart>
                    </div>
                    <div class = "expense-profit-container">
                        <div class="budgets-container">
                            <div style="display: flex; justify-content: space-between;">
                                Список бюджетов
                                <el-button type="primary" style="padding-left: 5px;" @click="callBudgetForm">
                                    <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                                    </svg>
                                    Добавить бюджет
                                </el-button>
                            </div>
                            <div class="chart-list" v-infinite-scroll="loadBudgets" style="overflow: auto; overflow-x: hidden;">
                                <ProgressRow 
                                    v-for="item in sortedBudgets"
                                    :key="item.name"
                                    :title="item.name"
                                    :amount="item.amount"
                                    :limit="item.limit"
                                    @click="callEditBudgetTab(item)"
                                    />
                            </div>
                        </div> 
                        <div class="expenses-piechart-container">
                            Структура расходов
                            <div class="pie-chart">
                                <apexchart type="donut" :series="piechartSeries" :options="piechartOptions" height="300"></apexchart>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right-side">
                    <div class="expenses-container">
                        <div class="expenses-container-toolbar">
                            Записи
                            <el-select-v2
                            v-model="selected_expenses_sort"
                            :options="expenses_sort_options"
                            placeholder="Сортировка"
                            style="vertical-align: middle; max-width: 240px; width: 200px; font-weight: 400;"
                            @change="onExpensesSortChanged()"
                            />
                        </div>
                        
                        <div class="operation-list" v-infinite-scroll="loadOperations" style="overflow: auto">
                            <OperationRow 
                                v-for="item in expenses"
                                :key="item.id"
                                :category="categories[item.categoryId].name || 'Прочее'"
                                :amount="item.amount"
                                :date="new Date(item.createdAt * 1000).toLocaleString()"
                                @click="callEditOperationTab(item)"
                                />
                        </div>
                    </div> 
                </div>
            </div>
        </div>
    </div>

    <!-- РАСХОДЫ -->
    <el-dialog v-model="expenseFormVisible" :title="getOperationFormTitle()" width="500" @close="clearAddOperationForm">
        <el-form :model="expenseFormBody" label-width="auto" >
            <el-form-item label="Сумма">
                <el-input-number v-model="expenseFormBody.amount" :min="0.01" style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
            <el-form-item label="Время">
                <el-date-picker
                v-model="expenseFormBody.timestamp" 
                type="datetime"
                placeholder="Выберите время"
                format="DD.MM.YYYY, HH:mm"
                value-format="x"
                style="width: 100%;"
                />
            </el-form-item>
            <el-form-item label="Категория">
                <el-select-v2
                    v-model="expenseFormBody.categoryId"
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
            <el-form-item label="Бюджет">
                <el-select-v2                             
                v-model="expenseFormBody.budgetId"
                :options="budgetsListForDropdown"
                placeholder="Выберите бюджет"
                style="min-width: 150px; vertical-align: middle; width: 100%"
                >
                <template #default="{ item }">
                    <div style="display: flex; justify-content: space-between;">
                        <span>{{ item.label }}</span>
                        <span>{{ item.amount }} / {{ item.limit }} ₽</span>
                    </div>
                </template>
                </el-select-v2>
            </el-form-item>
        </el-form>
        <template #footer>
        <div class="dialog-footer">
            <el-button @click="clearAddOperationForm">Отмена</el-button>
            <div v-if="hasEditingExpense">
                <el-button type="danger" @click="deleteOperation">Удалить</el-button>
                <el-button type="warning" @click="editOperation">Изменить</el-button>
            </div>
            <el-button v-else type="primary" @click="addOperation">Добавить</el-button>
        </div>
        </template>
    </el-dialog>

    <!-- БЮДЖЕТ -->
    <el-dialog v-model="budgetFormVisible" :title="getBudgetFormTitle()" width="600" @close="clearBudgetForm">
        <el-form :model="budgetFormBody" label-width="auto" >
            <el-form-item label="Название">
                <el-input v-model="budgetFormBody.name" :min="0.01" style="width: 100%;" maxlength="32" show-word-limit minlength="1"/>
            </el-form-item>
            <el-form-item label="Лимит">
                <el-input-number v-model="budgetFormBody.limit" :min="0.01" style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
            <el-form-item label="Категория">
                <el-select-v2
                    v-model="budgetFormBody.category"
                    :options="categories_selector_options"
                    placeholder="Прочее"
                    style="min-width: 150px; margin-right: 16px; vertical-align: middle; width: 100%;"
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
            <el-form-item label="Период">
                <el-select-v2
                v-model="budgetFormBody.periodType"
                :options="budgetPeriodList"
                placeholder="Выберите период"
                style="min-width: 150px; vertical-align: middle; width: 100%"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="clearBudgetForm">Отмена</el-button>
                <div v-if="hasEditingBudget">
                    <el-button  type="danger" @click="deleteBudget">Удалить</el-button>
                    <el-button  type="warning" @click="editBudget">Изменить</el-button>
                </div>
                <el-button v-else type="primary" @click="addBudget">Добавить</el-button>
            </div>
            <div v-if="hasEditingBudget" class="expenses-container" style="padding-top: 15px;">
                <div class="expenses-container-toolbar" style="border-top: 1px solid #dcdfe6; padding-top: 15px;">
                    <span style="font-size: 1.1rem; font-weight: 400;">Связанные расходы</span>
                    <el-select-v2
                    v-model="selected_expenses_sort"
                    :options="expenses_sort_options"
                    placeholder="Сортировка"
                    style="vertical-align: middle; max-width: 240px; width: 200px; font-weight: 400;"
                    @change="onExpensesSortChanged()"
                    />
                </div>
                <div  class="operation-list" v-infinite-scroll="loadBudgetExpenses" style="overflow: auto">
                    <OperationRow 
                        v-for="item in budgetExpenses"
                        :key="item.id"
                        :category="categories[item.categoryId].name || 'Прочее'"
                        :amount="item.amount"
                        :date="new Date(item.createdAt * 1000).toLocaleString()"
                        @click="callEditOperationTab(item)"
                        />
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
    flex-basis: 20%;
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

.expenses-piechart-container {
    flex-basis: 25%;
}

.expense-profit-container{
    display: flex;
    gap: 15px;
}

.main-container{
    display: flex;
    gap: 15px;
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

.chart-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.operation-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    max-height: 765px;
    list-style: none;
    color: #333338;
}

.toolbar-tools{
    display: flex;
    align-items: flex-end;
}

.expenses-container-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

@media (max-width: 1024px) {
    .expense-profit-container {
        display: block;
    }
}
</style>
