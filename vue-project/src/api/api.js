import axios from "axios";
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
                const errorMessage = error.response.data || "Неизвестная ошибка.";
                ElMessage.error(errorMessage)
                break
            case 401:
                ElMessage.error("Вы не авторизованы")
                break
            default:
                ElMessage.error(error)
                break
        }

        return Promise.reject(error);
    }
);

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

export const getExpenses = async (offset, limit, orderBy, order, minTimestamp, maxTimestamp, categories) => {
    const params = {
        offset: offset,
        limit: limit,
        orderBy: orderBy,
        order: order,
        minTimestamp: minTimestamp,
        maxTimestamp: maxTimestamp,
        categories: categories
    }
    return (await apiClient.get("expenses", { params: params})).data
}

export const addExpense = async (expense) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if(expense.categoryId.length == 0){
        expense.categoryId = null
    }
    if(expense.budgetId.length == 0){
        expense.budgetId = null
    }

    return (await apiClient.post(`expenses`, expense, { headers })).data
}

export const editExpense = async (id, editedExpense) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    editedExpense.timestamp = Math.floor(editedExpense.timestamp / 1000)

    return (await apiClient.put(`expenses/${id}`, editedExpense, { headers })).data
}

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