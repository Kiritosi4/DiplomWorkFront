<script setup>
defineProps({
    firstDigit: Number,
    secDigit: Number,
    thirdDigit: Number,
    thirdDigitDiff: Number,
    firstDigitDiff: Number,
    secDigitDiff: Number,
    firstTitle : String,
    secTitle : String,
    thirdTitle : String,
    firstPostfix : String,
    secPostfix : String,
    thirdPostfix : String,
})
</script>

<template>
    <el-row class="card-container">
      <el-col class="card1">
        <div class="statistic-card">
          <el-statistic :value=firstDigit group-separator=" ">
            <template #title>
              <div style="display: inline-flex; align-items: center">
                <span class="statistic-title">{{ firstTitle }}</span>
              </div>
            </template>
            <template #suffix>
              {{ firstPostfix }}
            </template>
          </el-statistic>
          <div class="statistic-footer">
            <div class="footer-item" v-if="firstDigitDiff != 0">
              <span>больше прошлого периода на </span>
              <span class="green" v-if="firstDigitDiff > 0">
                {{ firstDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 15 7-7 7 7"/>
                  </svg>
                </el-icon>
              </span>
              <span class="red" v-else>
                {{ firstDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19 9-7 7-7-7"/>
                  </svg>
                </el-icon>
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col  class="card2">
        <div class="statistic-card">
          <el-statistic :value=secDigit group-separator=" ">
            <template #title>
              <div style="display: inline-flex; align-items: center">
                <span class="statistic-title">{{ secTitle }} </span>
              </div>
            </template>
            <template #suffix>
              {{ secPostfix }}
            </template>
          </el-statistic>
          <div class="statistic-footer" >
            <div class="footer-item" v-if="secDigitDiff != 0 && secDigitDiff != NaN">
              <span>относительно прошлого периода</span>
              <span class="green" v-if="firstDigitDiff > 0">
                {{ secDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 15 7-7 7 7"/>
                  </svg>
                </el-icon>
              </span>
              <span class="red" v-else>
                {{ secDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19 9-7 7-7-7"/>
                  </svg>
                </el-icon>
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col class="card3">
        <div class="statistic-card">
          <el-statistic :value=thirdDigit group-separator=" ">
            <template #title>
              <div style="display: inline-flex; align-items: center">
                <span class="statistic-title">{{ thirdTitle }}</span>
              </div>
            </template>
            <template #suffix>
              {{ thirdPostfix }}
            </template>
          </el-statistic>
          <div class="statistic-footer">
            <div class="footer-item" v-if="thirdDigitDiff != 0 && thirdDigitDiff != NaN && thirdDigitDiff != null">
              <span>относительно прошлого периода</span>
              <span class="green" v-if="thirdDigitDiff > 0">
                {{ thirdDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 15 7-7 7 7"/>
                  </svg>
                </el-icon>
              </span>
              <span class="red" v-else>
                {{ thirdDigitDiff }}%
                <el-icon>
                  <svg class="w-[25px] h-[25px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19 9-7 7-7-7"/>
                  </svg>
                </el-icon>
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </template>
  
  <style scoped>
  :global(h2#card-usage ~ .example .example-showcase) {
    background-color: var(--el-fill-color) !important;
  }
  
  .el-statistic {
    --el-statistic-content-font-size: 28px;
  }

  .statistic-title{
    font-size: 16px;
  }
  
  .statistic-card {
    padding: 20px;
    border-radius: 4px;
    background-color: #ededed;
  }
  
  .statistic-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-top: 16px;
  }
  
  .statistic-footer .footer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .statistic-footer .footer-item span:last-child {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
  }
  
  .green {
    color: var(--el-color-success);
  }

  .red {
    color: var(--el-color-error);
  }

  .card-container{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr;
    grid-column-gap: 15px;
  }

  .card-container > div { 
    width: 100%;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    .card-container{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
    }

    .card1 { 
      grid-area: 1 / 1 / 2 / 3;
      margin-bottom: 15px;
     }
    .card2 { grid-area: 2 / 1 / 3 / 2; }
    .card3 { grid-area: 2 / 2 / 3 / 3; }
  }

  @media (max-width: 600px) {
    .card1 {
      margin-bottom: 0px;
    }
  }
  </style>
  