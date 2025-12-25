<template>
  <div class="app-container">
    <VbenPageWrapper title="用户管理" :content="'管理系统用户账号'">
      <template #extra>
        <el-button type="primary" @click="handleCreate">新增用户</el-button>
      </template>
      <template #search>
        <VbenForm
          :model="searchParams"
          :schemas="searchFormSchema"
          :submit-on-reset="false"
          @submit="handleSearch"
          @reset="handleReset"
        />
      </template>
      <template #default>
        <VbenTable
          ref="tableRef"
          :columns="columns"
          :dataSource="dataList"
          :loading="loading"
          :rowKey="(record) => record.id"
        >
          <template #action="{ record }">