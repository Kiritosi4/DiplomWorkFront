<script setup>
import Header from '../components/Header.vue';
import ProgressRow from '@/components/ProgressRow.vue';
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
const expensesSum = ref(0.0)
const expensesSumDiff = ref(0.0)
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
const categoriesLimit = 15
let totalCategories = 1000

const loadCategories = () => {
    if(Object.keys(categories).length - 1 >= totalCategories){
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
        api.editExpenseCategory(editingCategoryId.value, currCategoryName.value)
        .then(() => {
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

        Object.values(budgets).forEach(budget => {
            if(budget.categoryId === editingCategoryId.value){
                budget.categoryId = null
            }
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

// === БЮДЖЕТЫ ===
const budgets = reactive({})

const sortedBudgets = computed(() => {
    return Object.values(budgets).sort((a, b) => b.amount / b.limit - a.amount / a.limit);
});

const budgetPeriodList = [
    {
        value: 0,
        label: "Ежедневный"
    },
    {
        value: 1,
        label: "Еженедельный"
    },
    {
        value: 2,
        label: "Ежемесячный"
    },
    {
        value: 3,
        label: "Ежегодный"
    },
    {
        value: 4,
        label: "Свой период"
    },
]

const getBudgetRowPeriodLabel  = (budget) => {
    if(budget.periodType !== 4){
        return budgetPeriodList[budget.periodType].label
    }

    const startStr = new Date(budget.startPeriod * 1000).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    const endStr = new Date(budget.endPeriod * 1000).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })

    return `${startStr} - ${endStr}`
}

let budgetsListOffset = 0
const budgetsListLimit = 10
let totalBudgets = 1000

const loadBudgets = () => {
    if(Object.keys(budgets).length >= totalBudgets){
        return
    }

    api.getBudgets(
        budgetsListOffset, 
        budgetsListLimit
    )
    .then((response) => {
        totalBudgets = response.total
        response.data.forEach(budget => {
            budgets[budget.id] = budget
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

const selected_budget_expenses_sort = ref({
    order: "desc",
    orderBy: "CreatedAt"
})

const onBudgetExpensesSortChanged = () => {
    if(budgetExpensesListOffset < totalBudgetExpenses){
        budgetExpensesListOffset = 0
        totalBudgetExpenses = 1000
    }

    loadBudgetExpenses()
}

const pickedBudgetPeriod = ref([0, 0])

const budgetFormBody = reactive({
    "name": "",
    "categoryId": null,
    "limit": 0,
    "periodType": 2,
    get startPeriod() {
        return Math.floor(pickedBudgetPeriod.value[0] / 1000)
        
    },
    get endPeriod() {
        return Math.floor(pickedBudgetPeriod.value[1] / 1000)
    },
})

const callEditBudgetTab = (budget) => {
    budgetFormBody.name = budget.name
    budgetFormBody.categoryId = budget.categoryId
    budgetFormBody.limit = budget.limit

    budgetFormBody.periodType = budget.periodType
    
    if(budget.periodType == 4){
        pickedBudgetPeriod.value = [budget.startPeriod * 1000, budget.endPeriod * 1000]
    }

    editingBudgetId.value = budget.id

    hasEditingBudget.value = true
    budgetFormVisible.value = true

    loadBudgetExpenses()
}

const editBudget = () => {
    if(budgetFormBody.limit == null){
        ElMessage.error("Некорректный формат числа.")
        return
    }
    
    api.editBudget(editingBudgetId.value, budgetFormBody)
    .then((response) => {
        budgets[response.id] = response

        ElMessage.success("Бюджет изменен.")
        clearBudgetForm()
    })
}

const deleteBudget = () => {
    api.deleteBudget(editingBudgetId.value)
    .then(() => {
        delete budgets[editingBudgetId.value]

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
    if(budgetFormBody.limit == null){
        ElMessage.error("Некорректный формат числа.")
        return
    }

    api.addBudget(budgetFormBody)
    .then((response) => {
        response.amount = 0
        budgets[response.id] = response

        ElMessage.success("Новый бюджет создан.")
        clearBudgetForm()
    })
}

const clearBudgetForm = () => {
    budgetFormVisible.value = false
    budgetFormBody.categoryId = "",
    budgetFormBody.limit = 0,
    budgetFormBody.name = ""
    budgetFormBody.periodType = 2
    pickedBudgetPeriod.value = [0,0]

    if(hasEditingBudget){
        if(pickedPeriod.value !== null){
            const filteredExpenses =  expenses.value.filter(item => 
                item.createdAt >= getMinPickedTimestampSec() && item.createdAt < getMaxPickedTimestampSec()
            )

            expenses.value = filteredExpenses
        }

        if(selected_categories.value.length > 0){
            const filteredExpenses =  expenses.value.filter(item => 
                Object.values(selected_categories.value).includes(item.categoryId)
            )

            expenses.value = filteredExpenses
        }

        budgetExpensesListOffset = 0
        totalBudgetExpenses = 1000

    }
}

const budgetsListForDropdown = computed(() => {
    let val = Object.values(budgets).map(budget => ({
        label: budget.name,
        value: budget.id,
        amount: budget.amount,
        limit: budget.limit,
    }))
    val.unshift({
        label: "Без бюджета",
        value: null,
    })
    return val
});

// = Расходы бюджета =
const budgetExpenses = computed(() => {
    let filteredBudgetExpenses = expenses.value.filter(item => 
        item.budgetId === editingBudgetId.value
    )

    let sortedBudgetExpenses = []
    if(selected_budget_expenses_sort.value.orderBy === "Amount"){
        sortedBudgetExpenses = filteredBudgetExpenses.sort((a,b) => selected_budget_expenses_sort.value.order === "desc" ? b.amount - a.amount : a.amount - b.amount)
    }else{
        sortedBudgetExpenses = filteredBudgetExpenses.sort((a,b) => selected_budget_expenses_sort.value.order === "desc" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt)
    }

    return sortedBudgetExpenses
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
        budgetExpensesListLimit,
        selected_budget_expenses_sort.value.orderBy,
        selected_budget_expenses_sort.value.order
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

const filteredExpensesList = computed(() => {
    if(hasEditingBudget.value){
        let filteredExpenses = expenses.value

        if(pickedPeriod.value !== null){
            filteredExpenses =  expenses.value.filter(item => 
                item.createdAt >= getMinPickedTimestampSec() && item.createdAt < getMaxPickedTimestampSec()
            )
        }

        if(selected_categories.value.length > 0){
            filteredExpenses =  expenses.value.filter(item => 
                Object.values(selected_categories.value).includes(item.categoryId)
            )
        }

        return filteredExpenses
    }

    return expenses.value
});


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
        
        const existsIds = new Set(expenses.value.map(expense => expense.id));

        response.data.forEach(expense => {
            if(!existsIds.has(expense.id)){
                expenses.value.push(expense)
            }
        })

        response.categories.forEach(category => {
            categories[category["id"]] = category
        });

        response.budgets.forEach(budget => {
            budgets[budget["id"]] = budget
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
    if(expenseFormBody.amount == null){
        ElMessage.error("Некорректный фомрат числа.")
        return
    }

    const expenseIndex = expenses.value.findIndex(expense => expense.id === editingOperationId);
    const editedExpense =  expenses.value[expenseIndex] 
    
    const currBudget = budgets[editedExpense.budgetId]
    const pickedTimestampSec = dateCalc.milisToSec(expenseFormBody.timestamp)

    // Предупреждение о лимите бюджета
    let warningMessage = ""
    if(editedExpense.budgetId === expenseFormBody.budgetId){
        if(currBudget !== undefined && currBudget.startPeriod <= pickedTimestampSec && pickedTimestampSec <= currBudget.endPeriod){
            const diff = expenseFormBody.amount - editedExpense.amount
            const beforeInPeriod = currBudget.startPeriod <= editedExpense.createdAt && editedExpense.createdAt <= currBudget.endPeriod
            const futureAmount = beforeInPeriod ? currBudget.amount + diff : currBudget.amount + expenseFormBody.amount

            if(futureAmount > currBudget.limit){
                let diffBudget = futureAmount - currBudget.limit
                warningMessage = `После изменения расхода, бюджет "${currBudget.name}" будет превышен на ${diffBudget.toFixed(2)} ₽!`
            }
            if(futureAmount === currBudget.limit){
                warningMessage = `После изменения расхода, лимит бюджета "${currBudget.name}" будет достигнут!`
            }
        }
    }else{
        
        const newBudget = budgets[expenseFormBody.budgetId];
        if(newBudget !== undefined && newBudget.startPeriod <= pickedTimestampSec && pickedTimestampSec <= newBudget.endPeriod){
            if(newBudget.amount + expenseFormBody.amount > newBudget.limit){
                let diff = newBudget.amount + expenseFormBody.amount - newBudget.limit
                warningMessage = `После изменения расхода, бюджет "${newBudget.name}" будет превышен на ${diff.toFixed(2)}₽!`
            }
            if(newBudget.amount + expenseFormBody.amount === newBudget.limit){
                warningMessage = `После изменения расхода, лимит бюджета "${newBudget.name}" будет достигнут!`
            }
        }
    }

    if(warningMessage !== ""){
        ElMessageBox.confirm(
            warningMessage,
            'Внимание!',
            {
                confirmButtonText: 'Oк',
                cancelButtonText: 'Отмена',
                type: 'warning',
                dangerouslyUseHTMLString: true,
            }
        ).then(() => {
            editOperationConfirm(editedExpense, currBudget)
        }).catch(() => {
            return
        })
    }else{
        editOperationConfirm(editedExpense, currBudget)
    }
}

const editOperationConfirm = (editedExpense, currBudget) => {
    api.editExpense(editingOperationId, expenseFormBody)
    .then(() => {
        const amountDiff = editedExpense.amount - expenseFormBody.amount
        summaryAmount.value += amountDiff

        //Изменение связанного бюджета
        if(editedExpense.budgetId === expenseFormBody.budgetId) {
            if(currBudget !== undefined){
                const prevTimestampInPeriod = editedExpense.createdAt >= currBudget.startPeriod && editedExpense.createdAt < currBudget.endPeriod
                if(expenseFormBody.timestamp >= currBudget.startPeriod && expenseFormBody.timestamp < currBudget.endPeriod){
                    if(prevTimestampInPeriod){
                        currBudget.amount -= amountDiff
                    }else{
                        currBudget.amount += expenseFormBody.amount
                    }
                }else if(prevTimestampInPeriod){
                    currBudget.amount -= expenseFormBody.amount
                }
            }
        }else{
            if(currBudget !== undefined){
                if(editedExpense.createdAt >= currBudget.startPeriod && editedExpense.createdAt < currBudget.endPeriod){
                    currBudget.amount -= editedExpense.amount
                }
            }

            const newBudget = budgets[expenseFormBody.budgetId];
            if(newBudget !== undefined){
                
                if(expenseFormBody.createdAt > newBudget.startPeriod && expenseFormBody.createdAt < newBudget.endPeriod){
                    newBudget.amount += expenseFormBody.amount
                }
            }
        }

        clearOperationList()
        loadOperations()
        refreshCharts()
        if(hasEditingBudget.value){
            loadBudgetExpenses()
        }

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
        const myBudget = budgets[deletedExpense.budgetId]
        if(myBudget !== undefined && myBudget.startPeriod <= deletedExpense.createdAt && deletedExpense.createdAt <= myBudget.endPeriod){
            myBudget.amount -= deletedExpense.amount
        }
        summaryAmount.value += deletedExpense.amount

        expenses.value.splice(index, 1)
        refreshCharts()
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
    if(expenseFormBody.amount == null){
        ElMessage.error("Некорректный фомрат числа.")
        return
    }

    const expenseBudget = budgets[expenseFormBody.budgetId]
    const pickedTimestampSec = dateCalc.milisToSec(expenseFormBody.timestamp)

    // Предупреждение о лимите бюджета
    if(expenseBudget !== undefined && expenseBudget.startPeriod <= pickedTimestampSec && pickedTimestampSec <= expenseBudget.endPeriod){
        let warnMsg = ""
        if(expenseBudget.amount + expenseFormBody.amount > expenseBudget.limit){
            warnMsg = `После добавление расхода, бюджет "${expenseBudget.name}" будет превышен на ${expenseBudget.amount + expenseFormBody.amount - expenseBudget.limit}₽!`
        }

        if(expenseBudget.amount + expenseFormBody.amount == expenseBudget.limit){
            warnMsg = `После добавление расхода, лимит бюджета "${expenseBudget.name}" будет достигнут!`
        }

        if(warnMsg !== ""){
            ElMessageBox.confirm(
                warnMsg,
                'Внимание!',
                {
                    confirmButtonText: 'Oк',
                    cancelButtonText: 'Отмена',
                    type: 'warning',
                }
            ).then(() => {
                addOperationConfirm(expenseBudget)
            }).catch(() => {
                return
            })
        }else{
            addOperationConfirm(expenseBudget)
        }
    }else{
        addOperationConfirm(expenseBudget)
    }
}

const addOperationConfirm = (expenseBudget) => {
    expenseFormBody.timestamp = dateCalc.milisToSec(expenseFormBody.timestamp)

    api.addExpense(expenseFormBody)
    .then((response) => {
        clearOperationList()
        loadOperations()
        summaryAmount.value -= expenseFormBody.amount

        //Изменение связанного бюджета
        if(expenseBudget !== undefined){
            const startPeriod = dateCalc.getMinTimestampByPeriod(expenseBudget.periodType)
            const endPeriod = dateCalc.getMaxTimestampByPeriod(expenseBudget.periodType)

            if(startPeriod <= expenseFormBody.timestamp && expenseFormBody.timestamp <= endPeriod){
                expenseBudget.amount += expenseFormBody.amount
            }
        }

        ElMessage.success("Новая запись о расходе добавлена.")
        clearAddOperationForm()
        refreshCharts()
    })
}

const onExpenseFormCategoryChanged = (val) => {
    if(expenseFormBody.budgetId === "" || expenseFormBody.budgetId == null){
        const foundedBudget = Object.values(budgets).find(budget => budget.categoryId === val)

        if(foundedBudget !== undefined){
            expenseFormBody.budgetId = foundedBudget.id
        }else{
            api.getBudgetByCategory(expenseFormBody.categoryId)
            .then((response) => {
                if(response != ""){
                    budgets[response.id] = response
                    expenseFormBody.budgetId = response.id 
                }
            })
        }
    }
    
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
const mainchart_options = {
    chart: {
        type: 'line',
        zoom: {
            enabled: true,
            type: 'x',  
            autoScaleYaxis: false, 
            allowMouseWheelZoom: true,
        },
        toolbar: {
        show: true,
        offsetX: 0,
        offsetY: 0,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        }
      },
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => {
            return val.toLocaleString('ru-RU')
        }
    },
    stroke: {
        width: [0, 4]
    },
    tooltip: {
        y: {
            formatter: (val) => {
                return val.toLocaleString('ru-RU')
            }
        }
    }
}
const mainchart_series = ref([{
    name: "Расходы",
    type: 'column',
    data: [
        {
            x: '01.01.2024',
            y: 400
        },
        {
            x: '02.01.2024',
            y: 600
        },
    ],
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

        expensesSum.value = response.totalAmount

        /*
        if(response.lastTotalAmount != 0){
            expensesSumDiff.value = expensesSum.value / response.lastTotalAmount * 100
            expensesSumDiff.value = Number(expensesSumDiff.value.toFixed(2));
        }else{
            expensesSumDiff.value = 0.0
        }
        */

        operationAmount.value = response.totalOperations
        /*
        if(response.lastTotalOperations != 0){
            operationAmountDiff.value = operationAmount.value / response.lastTotalOperations * 100
            operationAmountDiff.value = Number(operationAmountDiff.value.toFixed(2));
        }else{
            operationAmountDiff.value = 0.0
        }*/
    }))
}
// ======

// === Bootstrap ===
loadCategories()
loadOperations()
loadBudgets()
refreshCharts()

api.getSummaryAmount()
    .then((response => {
        summaryAmount.value = response
    }))
//======
</script>

<template>
    <Header :activeTab="3" />
    <div class = "content">
        <div class = "wrapper">
            <div class="toolbar">
                <h1>Бюджеты и расходы</h1>
                <div class="toolbar-tools">
                    <el-button type="primary" @click="callAddOperationForm">
                        <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                        </svg>
                        Добавить расход
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
                        format="DD.MM.YYYY"
                        @change="onPeriodChanged()"
                    />
                </div>
            </div>
            
            <div class="main-stats">
                <StatiscticCards  
                first-title="💸 Расходы за период"
                :first-digit="expensesSum"
                :first-digit-diff="expensesSumDiff"
                sec-title="📑 Количество расходов"
                :sec-digit="operationAmount"
                :sec-digit-diff="operationAmountDiff"
                third-title="💰 Разница доходов и расходов"
                :third-digit="summaryAmount"
                first-postfix="₽"
                third-postfix="₽"
                />
            </div>

            <div class = "main-container">
                <div class="budgets-container grid-chain grid2">
                    <div style="display: flex; justify-content: space-between;">
                        📋 Список бюджетов
                        <el-button type="primary" style="padding-left: 5px;" @click="callBudgetForm">
                            <svg class="w-[20px] h-[20px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="margin-right: 5px;">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                            </svg>
                            Добавить бюджет
                        </el-button>
                    </div>
                    <div v-if="Object.keys(budgets).length > 0" class="chart-list" v-infinite-scroll="loadBudgets" style="overflow: auto; overflow-x: hidden;">
                        <ProgressRow 
                            v-for="item in sortedBudgets"
                            :key="item.name"
                            :title="item.name"
                            :amount="item.amount"
                            :limit="item.limit"
                            :period-info="getBudgetRowPeriodLabel(item)"
                            @click="callEditBudgetTab(item)"
                            />
                    </div>
                    <div v-else style="text-align: center; align-items: center; position: relative; top: 40%;">
                        <span style="opacity: 50%;">Нет установленных бюджетов</span>
                    </div>
                </div>
                <div class="right-side grid4">
                    <div class="expenses-container">
                        <div class="expenses-container-toolbar">
                            📋 Расходы
                            <el-select-v2
                            v-model="selected_expenses_sort"
                            :options="expenses_sort_options"
                            placeholder="Сортировка"
                            style="vertical-align: middle; max-width: 180px; width: 180px; font-weight: 400;"
                            @change="onExpensesSortChanged()"
                            />
                        </div>
                        
                        <div class="operation-list" v-infinite-scroll="loadOperations" style="overflow: auto">
                            <OperationRow 
                                v-for="item in filteredExpensesList"
                                :key="item.id"
                                :category="categories[item.categoryId].name || 'Прочее'"
                                :amount="item.amount"
                                :date="new Date(item.createdAt * 1000).toLocaleString()"
                                @click="callEditOperationTab(item)"
                                />
                        </div>
                        <div v-if="filteredExpensesList.length == 0" style="text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; position: relative; top: 40%;">
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
                <div class="expenses-piechart-container grid-chain grid3">
                    📊 Структура расходов
                    <div class="pie-chart">
                        <apexchart type="donut" :series="piechartSeries" :options="piechartOptions"></apexchart>
                    </div>
                </div>
                <div class = "main-chart grid1">
                    📊 График расходов
                    <apexchart height="300" type="line" :options="mainchart_options" :series="mainchart_series"></apexchart>
                </div>
            </div>
        </div>
    </div>

    <!-- РАСХОДЫ -->
    <el-dialog v-model="expenseFormVisible" :title="getOperationFormTitle()" @close="clearAddOperationForm" style="width: 90%; max-width: 500px;">
        <el-form :model="expenseFormBody" label-width="auto" >
            <el-form-item label="Сумма">
                <el-input-number 
                v-model="expenseFormBody.amount" 
                :min="0.01"
                :precision="2"
                :max="100000000000000"
                style="width: 100%;">
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
                :clearable="false"
                />
            </el-form-item>
            <el-form-item label="Категория">
                <el-select-v2
                    v-model="expenseFormBody.categoryId"
                    :options="categories_selector_options"
                    placeholder="Прочее"
                    style="min-width: 150px; margin-right: 16px; vertical-align: middle;"
                    @visible-change="handleCategoryDropdownVisible"
                    @change="onExpenseFormCategoryChanged"
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
                clearable
                >
                <template #default="{ item }">
                    <div style="display: flex; justify-content: space-between;">
                        <span>{{ item.label }}</span>
                        <span v-if="item.limit > 0">{{ item.amount }} / {{ item.limit }} ₽</span>
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
    <el-dialog v-model="budgetFormVisible" :title="getBudgetFormTitle()"  style="width: 90%; max-width: 600px;" @close="clearBudgetForm">
        <el-form :model="budgetFormBody" label-width="auto" >
            <el-form-item label="Период" class="budget-up-datepicker">
                <el-select-v2
                v-model="budgetFormBody.periodType"
                :options="budgetPeriodList"
                placeholder="Выберите период"
                style="min-width: 150px; vertical-align: middle; width: 100%"
                />
            </el-form-item>
            <el-form-item
            v-if="budgetFormBody.periodType === 4"
            class="budget-up-datepicker"
            >
            <el-date-picker
                v-model="pickedBudgetPeriod"
                type="daterange"
                unlink-panels
                range-separator="-"
                start-placeholder="От"
                end-placeholder="До"
                style="width: 100%;"
                value-format="x"
                :default-time="defaultTime"
                format="DD.MM.YYYY"
            />
            </el-form-item>

            <el-form-item label="Название">
                <el-input v-model="budgetFormBody.name" :min="0.01" style="width: 100%;" maxlength="32" show-word-limit minlength="1"/>
            </el-form-item>
            <el-form-item label="Лимит">
                <el-input-number 
                v-model="budgetFormBody.limit" 
                :min="0.01"
                :precision="2"
                :max="100000000000000"
                style="width: 100%;">
                    <template #suffix>
                        <span>₽</span>
                    </template>
                </el-input-number>
            </el-form-item>
            
            <el-form-item label="Категория">
                <el-select-v2
                    v-model="budgetFormBody.categoryId"
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
            <el-form-item label="Период" class="budget-down-datepicker">
                <el-select-v2
                v-model="budgetFormBody.periodType"
                :options="budgetPeriodList"
                placeholder="Выберите период"
                style="min-width: 150px; vertical-align: middle; width: 100%"
                />
            </el-form-item>
            <el-form-item
            v-if="budgetFormBody.periodType === 4"
            class="budget-down-datepicker"
            >
            <el-date-picker
                v-model="pickedBudgetPeriod"
                type="daterange"
                unlink-panels
                range-separator="-"
                start-placeholder="От"
                end-placeholder="До"
                style="width: 100%;"
                value-format="x"
                :default-time="defaultTime"
                format="DD.MM.YYYY"
            />
            </el-form-item>
            <el-form-item label="Потрачено" v-if="hasEditingBudget">
                <el-progress 
                :percentage="Math.floor(( budgets[editingBudgetId].amount / budgetFormBody.limit) * 100)" 
                :color="[
                    { color: '#1989fa', percentage: 50 },
                    { color: '#e6a23c', percentage: 75 },
                    { color: '#f56c6c', percentage: 100 },
                ]" 
                :stroke-width="8"
                style="width: 100%;"
                />
                <span style="height: 25px; margin-right: auto;">{{ budgets[editingBudgetId].amount.toLocaleString('ru-RU') }} / {{ budgetFormBody.limit.toLocaleString('ru-RU') }} ₽</span>
                <span style="height: 25px; margin-left: auto;">{{ Math.max(0, Number( budgetFormBody.limit - budgets[editingBudgetId].amount).toFixed(2)).toLocaleString('ru-RU') }} ₽ осталось</span>
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
                    <span style="font-size: 1.1rem; font-weight: 400; text-align: left;">Связанные расходы</span>
                    <el-select-v2
                    v-model="selected_budget_expenses_sort"
                    :options="expenses_sort_options"
                    placeholder="Сортировка"
                    style="vertical-align: middle; max-width: 240px; width: 200px; font-weight: 400;"
                    @change="onBudgetExpensesSortChanged()"
                    />
                </div>
                <div class="operation-list budget-expenses" v-infinite-scroll="loadBudgetExpenses" style="overflow: auto; text-align: right;">
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

.expense-profit-container{
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

.budget-expenses {
    max-height: 276px;
}

.toolbar-tools{
    display: flex;
    align-items: flex-end;
    gap: 15px
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

.toolbar-tools > .el-button {
    padding-block: 8px;
    padding-left: 5px;
}


@media (max-width: 1700px) {
    .wrapper {
        padding-inline: 2%;
    }
}

@media (max-width: 1024px) {
    .expense-profit-container {
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

    .toolbar-tools{
        flex-wrap: wrap;
    }
}

.budget-up-datepicker{
    display: none;
}

@media (max-width: 750px) {
    :global(.el-date-range-picker) {
        width: 100% !important;
    }
    :global(.el-picker-panel__body) {
        display: flex;
        flex-direction: column;
        min-width: 0px !important;
    }

    :global(.el-picker-panel__content.el-date-range-picker__content) {
        width: 100% !important;
    }

    :global(.el-picker-panel__sidebar){
        width: 95px;
    }

    .budget-down-datepicker{
        display: none;
    }

    .budget-up-datepicker{
        display: flex;
    }

}



</style>
