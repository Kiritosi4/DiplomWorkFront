<script setup>
import { useRouter } from 'vue-router';
import * as api from '@/api/api';

const router = useRouter();

const login = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(email)) {
        alert("Введите корректный email.");
        return;
    }
    if (password.length < 8) {
        alert("Пароль должен содержать не менее 8 символов.");
        return;
    }

    api.login(email, password)
    .then((response) => {
        router.push("/")
    })
    .catch((error) => { console.error(error) })
}
</script>

<template>
<div class="login-form-container">
    <span>Вход</span>
    <div class="login-form">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" inlength="8" required placeholder="Пароль">
        <el-button type="primary" class="submit-btn" @click="login()">Войти</el-button>
        <a href="/register">Зарегистрироваться</a>
    </div>
    
</div>
</template>

<style scoped>
.login-form-container {
    text-align: center;
    display: flex; /* Используем flexbox для центрирования */
    flex-direction: column;
    justify-content: center; /* Центрируем по горизонтали */
    align-items: center; /* Центрируем по вертикали */
    height: 100vh; /* Высота контейнера равна высоте окна */
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