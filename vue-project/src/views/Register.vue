<script setup>
import * as api from '@/api/api';
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router';
import { ref } from "vue"

const router = useRouter();

const email = ref('')
const name = ref('')
const password = ref('')
const password_confirm = ref('')

const register = () => {
    

    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(email.value) || email.value.length > 256) {
        alert("Введите корректный email.");
        return;
    }
    if (name.value.length < 2) {
        alert("Имя должно быть длиннее 2 символов.");
        return;
    }
    if (name.value.length > 128) {
        alert("Имя должно быть короче 128 символов.");
        return;
    }
    if (password.value.length < 8) {
        alert("Пароль должен содержать не менее 8 символов.");
        return;
    }
    if (password.value.length > 128) {
        alert("Пароль должен быть короче 128 символов.");
        return;
    }

    if (password.value !== password_confirm.value){
        alert("Пароли не совпадают.");
        return;
    }

    api.register(email.value, name.value, password.value)
    .then((response) => {
        router.push("/")
    })
    .catch((error) => { console.error(error) })
}
</script>

<template>
<div class="login-form-container">
    <span>Регистрация</span>
    <div class="login-form">
        <input type="email" id="email" placeholder="Email" required v-model="email">
        <input type="text" id="name" placeholder="Имя" required minlength="2" v-model="name">
        <input type="password" id="password" minlength="8" required placeholder="Пароль" v-model="password">
        <input type="password" id="password_confirm" minlength="8" required placeholder="Подтвердите пароль" v-model="password_confirm">
        <el-button type="primary" class="submit-btn" @click="register()">Зарегистрироваться</el-button>
    </div>
    
</div>
</template>

<style scoped>
.login-form-container {
    text-align: center;
    display: flex; 
    flex-direction: column;
    justify-content: center; 
    align-items: center; 
    height: 100vh; 
    color: #333338;
}

.login-form {
    border-radius: 4px;
    width: 20%;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 15px;
    border-radius: 10px;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    min-width: 300px;
}

.login-form-container > span {
    font-size: 32px;
    font-weight: 700;
}

.login-form > input {
    border: none;
    height: 2rem;
    border-radius: 10px;
    padding-left: 10px;
    font-size: 1rem;
    font-weight: 550;
    background-color: #ededed;
    min-height: 40px;
    color: #333338;
}

.submit-btn {
    font-weight: 600;
    border-radius: 10px;
    font-size: 1rem;
    min-height: 40px;
}

</style>