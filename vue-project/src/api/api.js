import axios from "axios";
import qs from 'qs';
import { ElMessage } from 'element-plus'


const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/',
    withCredentials: true,
});

apiClient.interceptors.response.use(
    response =>{
        return response;
    },
    error => {
        switch (error.response.status) {
            case 400:
                const errorMessage = error.response.data || "Неизвестная ошибка";
                ElMessage.error(errorMessage)
                break
            case 401:
                ElMessage.error("Вы не авторизованы")
                break
            default:
                ElMessage.error("Неизвестная ошибка")
                break
        }

        return Promise.reject(error);
    }
);

const filterNullValues = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => value !== null && value !== "null" && value !== "")
    );
};

const replaceNullGuids = (obj) => {
    return obj.map(item => item === null || item == "null" ? "00000000-0000-0000-0000-000000000000" : item);
}

const getTimeZoneOffset = () => {
    return new Date().getTimezoneOffset() / -60;
}

export const me = async () => {
    return (await apiClient.get("users/me")).data
}

export const login = async (email, password) => {
    const params = {
        email: email,
        password: password
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    return (await apiClient.post(`/auth/login`, params, { headers })).data
}

export const register = async (email, name, password) => {
    const params = {
        email: email,
        name: name,
        password: password
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    return (await apiClient.post(`/auth/register`, params, { headers })).data
}

export const logout = async () => {
    return (await apiClient.get("users/logout")).data
}

export const getSummaryAmount = async () => {
    return (await apiClient.get("users/summary-amount")).data
}

// === РАСХОДЫ ===
export const getExpenses = async (offset, limit, orderBy, order, minTimestamp, maxTimestamp, categories) => {
    const params = {
        offset: offset,
        limit: limit,
        orderBy: orderBy,
        order: order,
        minTimestamp: minTimestamp,
        maxTimestamp: maxTimestamp,
        categories: replaceNullGuids(categories),
        timezone: getTimeZoneOffset()
    }
    return (await apiClient.get("expenses", { 
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
    })).data
}

export const addExpense = async (expense) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(expense)

    return (await apiClient.post(`expenses`, filteredData, { headers })).data
}

export const editExpense = async (id, editedExpense) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    editedExpense.timestamp = Math.floor(editedExpense.timestamp / 1000)

    return (await apiClient.put(`expenses/${id}`, editedExpense, { headers })).data
}

export const deleteExpense = async (id) => {
    return (await apiClient.delete(`expenses/${id}`)).data
}

export const getExpensesDashboard = async (minTimestamp, maxTimestamp, categories) => {
    const params = {
        minTimestamp: minTimestamp,
        maxTimestamp: maxTimestamp,
        categories: replaceNullGuids(categories),
        timezoneOffset: getTimeZoneOffset()
    }
    return (await apiClient.get("expenses/dashboard", { 
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
    })).data
}
// ======

// === КАТЕГОРИИ РАСХОДОВ ===
export const getExpenseCategories = async (offset, limit) => {
    const params = {
        offset: offset,
        limit: limit
    }

    return (await apiClient.get("expenses/category", { params: params})).data
}

export const addExpenseCategory = async (name) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const params = {
        name: name,
    }

    return (await apiClient.post(`expenses/category`, params, { headers })).data
}

export const editExpenseCategory = async (categoryId, name) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const params = {
        name: name,
    }

    return (await apiClient.put(`expenses/category/${categoryId}`, params, { headers })).data
}

export const deleteExpenseCategory = async (categoryId) => {
    
    return (await apiClient.delete(`expenses/category/${categoryId}`)).data
}
// ======

// === БЮДЖЕТЫ ===
export const getBudgets = async (offset, limit) => {
    const params = {
        offset: offset,
        limit: limit,
        timezone: getTimeZoneOffset()
    }

    return (await apiClient.get("budgets", { params: params})).data
}

export const addBudget = async (budgetForm) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(budgetForm)
    if(!filteredData.hasOwnProperty('name')){
        filteredData["name"] = "Без названия"
    }

    return (await apiClient.post(`budgets`, filteredData, { headers })).data
}

export const editBudget = async (budgetId, budgetForm) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(budgetForm)
    if(!filteredData.hasOwnProperty('name')){
        filteredData["name"] = "Без названия"
    }

    filteredData["TimezoneOffset"] = getTimeZoneOffset()

    return (await apiClient.put(`budgets/${budgetId}`, filteredData, { headers })).data
}

export const deleteBudget = async (budgetId) => {
    
    return (await apiClient.delete(`budgets/${budgetId}`)).data
}

export const getBudgetExpenses = async (budgetId, offset, limit) => {
    const params = {
        offset: offset,
        limit: limit
    }

    return (await apiClient.get(`budgets/${budgetId}/expenses`, { params: params})).data
}
// ======

// === РАСХОДЫ ===
export const getProfits = async (offset, limit, orderBy, order, minTimestamp, maxTimestamp, categories) => {
    const params = {
        offset: offset,
        limit: limit,
        orderBy: orderBy,
        order: order,
        minTimestamp: minTimestamp,
        maxTimestamp: maxTimestamp,
        categories: replaceNullGuids(categories)
    }
    return (await apiClient.get("profits", { 
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
    })).data
}

export const addProfit = async (profit) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(profit)

    return (await apiClient.post(`profits`, filteredData, { headers })).data
}

export const editProfit = async (id, editedProfit) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    editedProfit.timestamp = Math.floor(editedProfit.timestamp / 1000)

    return (await apiClient.put(`profits/${id}`, editedProfit, { headers })).data
}

export const deleteProfit = async (id) => {
    return (await apiClient.delete(`profits/${id}`)).data
}

export const getProfitsDashboard = async (minTimestamp, maxTimestamp, categories) => {
    const params = {
        minTimestamp: minTimestamp,
        maxTimestamp: maxTimestamp,
        categories: replaceNullGuids(categories),
        timezoneOffset: getTimeZoneOffset()
    }
    return (await apiClient.get("profits/dashboard", { 
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
    }))
    .data
}
// ======

// === КАТЕГОРИИ РАСХОДОВ ===
export const getProfitCategories = async (offset, limit) => {
    const params = {
        offset: offset,
        limit: limit
    }

    return (await apiClient.get("profits/category", { params: params})).data
}

export const addProfitCategory = async (name) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const params = {
        name: name,
    }

    return (await apiClient.post(`profits/category`, params, { headers })).data
}

export const editProfitCategory = async (categoryId, name) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const params = {
        name: name,
    }

    return (await apiClient.put(`profits/category/${categoryId}`, params, { headers })).data
}

export const deleteProfitCategory = async (categoryId) => {
    
    return (await apiClient.delete(`profits/category/${categoryId}`)).data
}
// ======

// === ЦЕЛИ ===
export const getTargets = async (offset, limit, filter) => {
    const params = {
        offset: offset,
        limit: limit,
        filter: filter
    }

    return (await apiClient.get("targets", { params: params})).data
}

export const addTarget = async (targetForm) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(targetForm)
    if(!filteredData.hasOwnProperty('name')){
        filteredData["name"] = "Без названия"
    }

    return (await apiClient.post(`targets`, filteredData, { headers })).data
}

export const editTargets = async (budgetId, budgetForm) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const filteredData = filterNullValues(budgetForm)
    if(!filteredData.hasOwnProperty('name')){
        filteredData["name"] = "Без названия"
    }

    filteredData["TimezoneOffset"] = getTimeZoneOffset()

    return (await apiClient.put(`targets/${budgetId}`, filteredData, { headers })).data
}

export const deleteTarget = async (targetId) => {
    
    return (await apiClient.delete(`targets/${targetId}`)).data
}
// ======