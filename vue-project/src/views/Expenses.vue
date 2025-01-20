<script setup>
import Header from '../components/Header.vue';
import ProgressRow from '@/components/ProgressRow.vue';
import StatiscticCards from '../components/StatiscticCards.vue';
import { reactive, ref, computed, unref } from 'vue';
import * as dateCalc from '@/api/dateCalculator';
import OperationRow from '@/components/OperationRow.vue';
import * as api from '@/api/api';
import { ElMessage } from 'element-plus'

const pickedPeriod = ref([dateCalc.getStartOfMonth(), new Date()])

const onPeriodChanged  = () => {
    clearOperationList()
    loadCategories()
    loadOperations()
}

const mainchart_series = ref([{
    name: "sales",
    data: [
    {
        x: '2019/01/01',
        y: 400
    },
    {
        x: '2019/01/01',
        y: 400
    },  
    {
        x: '2019/04/01',
        y: 430
    }, 
    {
        x: '2019/07/01',
        y: 448
    }, 
    {
        x: '2019/10/01',
        y: 470
    }, 
    {
        x: '2020/01/01',
        y: 540
    }, 
    {
        x: '2020/04/01',
        y: 580
    }, 
    {
        x: '2020/07/01',
        y: 690
    }, 
    {
        x: '2020/10/01',
        y: 690
    }]
}])

const mainchart_options = {}

const expense_series = ref([44, 55, 41, 17, 15])
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
        ElMessage.success("Категория удалена.")   
    })
    clearAddCategoryTab()
}

const openCategoryAddForm = () => {
    clearAddCategoryTab()
    is_adding_category.value = true
    currCategoryName.value = ""
    categoryFormOpened.value = true
    alert(categoryDropdownOffset.value)
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

const budgetsList = ref([
  {
    id: "1235213",
    name: 'Еда',
    amount: 600,
    limit: 1000,
  },
  {
    id: "1235213",
    name: 'Топливо',
    amount: 100,
    limit: 1000,
  },
  {
    id: "1235213",
    name: 'Развлечения',
    amount: 900,
    limit: 1000,
  }
])

const budgetsListForDropdown = computed(() => {
    return budgetsList.value.map(budget => ({
        label: budget.name,
        value: budget.id,
        amount: budget.amount,
        limit: budget.limit,
    }));
});

// === Расходы ===
const expenses = ref([])

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
        selected_expenses_sort.value["order"], 
        selected_expenses_sort.value["orderBy"], 
        Math.floor(pickedPeriod.value[0].valueOf() / 1000),
        Math.floor(pickedPeriod.value[1].valueOf() / 1000),
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
    expenses.value = []
    expensesListOffset = 0
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
    return hasEditingExpense.value ? "Редактирование категории" : "Добавление категории"
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
        let index = expenses.value.findIndex(expense => expense.id === editingOperationId);
        let editedExpense =  expenses.value[index] 

        editedExpense.amount = expenseFormBody.amount
        editedExpense.categoryId = expenseFormBody.categoryId
        editedExpense.createdAt = expenseFormBody.timestamp
        editedExpense.budgetId = expenseFormBody.budgetId

        ElMessage.success("Запись о расходе изменена.")
        clearAddOperationForm()
    })
}

const callAddOperationForm = () => {
    hasEditingExpense.value = false
    clearAddOperationForm()
    expenseFormVisible.value = true
}

const addOperation = () => {
    expenseFormBody.timestamp = Math.floor(expenseFormBody.timestamp / 1000)

    api.addExpense(expenseFormBody)
    .then((response) => {
        expenses.value.push(response);

        ElMessage.success("Новая запись о расходе добавлена")
        clearAddOperationForm()
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


// === Bootstrap ===
loadCategories()
loadOperations()
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
                                maxlength="128"
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
                                <el-button type="primary" style="margin-right: 15px; padding-left: 5px;" @click="callAddOperationForm">
                                    <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                                    </svg>
                                    Добавить бюджет
                                </el-button>
                            </div>
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
                        <div class="expenses-piechart-container">
                            Структура расходов
                            <div class="pie-chart">
                                <apexchart type="donut" :options="expense_chartOptions" :series="expense_series" height="300"></apexchart>
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


    <el-dialog v-model="expenseFormVisible" :title="getOperationFormTitle()" width="400" @close="clearAddOperationForm">
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
                    style="min-width: 150px; margin-right: 16px; vertical-align: middle; max-width: 240px"
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
                                maxlength="128"
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
            <el-button v-if="hasEditingExpense" type="primary" @click="editOperation">Изменить</el-button>
            <el-button v-else type="primary" @click="addOperation">Добавить</el-button>
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

@media (max-width: 1024px) {
    .expense-profit-container {
        display: block;
    }
}
</style>
