<script setup>
import * as api from '@/api/api';
import { ref } from "vue"
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps({
    activeTab: Number
})

const name = ref("Пользователь")
api.me()
    .then((response) => {
        name.value = response['name']
    })
    .catch((error) => { 
        if (error.response.status === 401){
            router.push('/login')
        }else{
            console.log(error)
        }
    })

const logout = () => {
    api.logout()
    router.push('/login')
}

const navbarContentClass = ref("navbar-content")

const callNavbar = () => {
    navbarContentClass.value = navbarContentClass.value === 'navbar-content' 
    ? 'navbar-content responsive' 
    : 'navbar-content';
}
</script>

<template>
    <header class="navbar">
        <div class="navbar-wrapper">
            <div class="navbar-logo">
                <span>Персональный бюджет</span>
            </div>
            <div :class="navbarContentClass">
                <div class="navbar-tabs">
                    <a class="navbar-tab" :class="{ active: activeTab === 1 }" href="/">
                        Дашборд
                    </a>
                    <a class="navbar-tab" :class="{ active: activeTab === 3 }" href="/expenses">
                        Бюджеты
                    </a>
                    <a class="navbar-tab" :class="{ active: activeTab === 2 }" href="/profits">
                        Доходы
                    </a>
                </div>
                <div class="user-bar">
                    <div class="user-info">
                        <img src="./icons/profile.png" alt="" width="25px" height="25px">
                        <span>{{ name }}</span>
                    </div>
                    <button class="logout-btn" @click="logout()" title="Выйти">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
                        </svg>
                    </button>
                </div>
                <div class="login-nav" hidden>
                    <el-button type="primary" round>Войти</el-button>
                </div>
            </div>
            <button class="navbar-btn" @click="callNavbar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2f4f4f"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 6H20M4 12H20M4 18H20" stroke="#2f4f4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            </button>
        </div>
        
    </header>
</template>

<style scoped>
.navbar {
    position: sticky;
    width: 100%;
    top: 0;
    left: 0;
    border-bottom: 1px solid #dcdfe6;
    font-weight: 500;
    color: #2f4f4f;
    background-color: white;
    z-index: 100;
}

.navbar-wrapper {
    padding: 0 55px 0 50px;
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
}

.navbar-logo {
    display: flex;
    align-items: center;
    height: 55px;
    font-size: 1.3rem;
    text-align: center;
}

.navbar-content {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.logout-btn {
    border: none;
    background: none;
    cursor: pointer;
    margin-left: 15px;
    display: flex; 
    align-items: center; 
    text-align: center;
    color: #2f4f4f;
    transition: .3s;
}

.logout-btn:hover {
    color: #409eff;
}

.user-bar {
    display: flex; 
    align-items: center; 
}

.user-info {
    display: flex; 
    align-items: center; 
    text-align: center;
}

.user-info > img {
    margin-inline: 10px;
}

.navbar-tabs {
    display: flex;
}

.navbar-btn {
    border: none;
    background-color: rgba(0, 0, 0, 0);
    width: 50px;
    height: 50px;
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    display: none;
}

.navbar-tab {
    display: block;
    padding-inline: 5px;
    cursor: pointer;
    color: #2f4f4f;
    margin-inline: 5px;
    text-decoration: none;
    transition: .3s;
    border-bottom: 2px solid transparent;
    line-height: 52px;
}

.navbar-tab:hover {
    color: #409eff;
}

.active {
    border-bottom: 2px solid #409eff;
}

@media only screen and (max-width: 1200px) {
    .navbar-wrapper{
        padding-inline: 10px;
    }
}

@media only screen and (max-width: 768px) {
    .navbar-wrapper{
        flex-direction: column;
        padding: 0 20px 0 15px;
    }

    .navbar-tabs {
        flex-direction: column;
        width: 100%;
    }

    .navbar-content{
        flex-direction: column;
        align-items: start;
        display: none;
        padding-bottom: 10px;
    }

    .navbar-content.responsive{
        display: flex;
    }

    .navbar-tab{
        width: 100%;
    }

    .user-bar{
        align-items: start;
        margin-top: 10px;
    }

    .user-info > img {
        margin-right: 5px;
        margin-left: 5px;
    }

    .logout-btn {
        margin-left: 5px;
    }

    .navbar-btn {
        display: block;
    }
}

</style>