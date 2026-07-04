<script setup lang="ts">
import { reactive } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const model = reactive({
  title: '',
  period: null as [number, number] | null,
  status: '草稿',
  coverTitle: '',
  summary: '',
  rules: ''
});

function backToList() {
  routerPushByKey('activity_list');
}

function saveActivity() {
  window.$message?.success('活动已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">新建活动</h2>
          <p class="mt-6px text-13px text-#777">配置活动周期、封面图和前台活动说明。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveActivity">保存活动</NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NForm :model="model" label-placement="top">
        <NGrid :cols="2" :x-gap="16">
          <NFormItemGi label="活动名称" path="title">
            <NInput v-model:value="model.title" placeholder="例如：第 3 期夜间光影" />
          </NFormItemGi>
          <NFormItemGi label="活动状态" path="status">
            <NSelect
              v-model:value="model.status"
              :options="[
                { label: '草稿', value: '草稿' },
                { label: '预热', value: '预热' },
                { label: '进行中', value: '进行中' }
              ]"
            />
          </NFormItemGi>
          <NFormItemGi label="活动周期" path="period">
            <NDatePicker v-model:value="model.period" class="w-full" type="datetimerange" clearable />
          </NFormItemGi>
          <NFormItemGi label="封面标题" path="coverTitle">
            <NInput v-model:value="model.coverTitle" placeholder="用于前台封面主标题" />
          </NFormItemGi>
        </NGrid>

        <NFormItem label="活动封面图" path="cover">
          <NUpload :default-upload="false" list-type="image-card" accept="image/*" />
        </NFormItem>

        <NFormItem label="活动摘要" path="summary">
          <NInput
            v-model:value="model.summary"
            type="textarea"
            placeholder="列表和分享页展示的短文案"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </NFormItem>

        <NFormItem label="活动规则" path="rules">
          <NInput
            v-model:value="model.rules"
            type="textarea"
            placeholder="分段填写参与方式、积分规则、奖励说明和异常处理"
            :autosize="{ minRows: 8, maxRows: 14 }"
          />
        </NFormItem>
      </NForm>
    </NCard>
  </NSpace>
</template>
