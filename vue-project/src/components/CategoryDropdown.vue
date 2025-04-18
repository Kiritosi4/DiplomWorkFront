<script setup>
import { computed } from 'vue';

const props = defineProps({
    model,
    loadCategories,
})

const categories_selector_options = computed(() => {
    return Object.keys(categories).map(key => ({
        value: key,
        label: categories[key]["name"],
        ownerId: categories[key]["ownerID"]
    }));
})

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
</script>

<template>
<el-select-v2
    v-model="model"
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
</template>

<style scoped>

</style>