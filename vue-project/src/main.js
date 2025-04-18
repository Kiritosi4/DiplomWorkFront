import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import ru from 'element-plus/dist/locale/ru'
import 'element-plus/dist/index.css'
import VueApexCharts from "vue3-apexcharts";

const app = createApp(App)

app.use(router)
app.use(ElementPlus, {
    locale: ru
})
app.use(VueApexCharts)

app.component("apexchart", VueApexCharts)

app.mount('#app')
