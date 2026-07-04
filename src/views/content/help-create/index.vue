<script setup lang="ts">
import { reactive } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const model = reactive({
  title: '',
  category: '玩法说明',
  status: '已发布',
  coverEnabled: false,
  summary: '',
  content: ''
});

function backToList() {
  routerPushByKey('content_help');
}

function saveHelp() {
  window.$message?.success('帮助内容已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">新增帮助</h2>
          <p class="mt-6px text-13px text-#777">维护玩法说明、答题规则和内容规范的前台展示文案。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveHelp">保存内容</NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NForm :model="model" label-placement="top">
        <NGrid :cols="3" :x-gap="16">
          <NFormItemGi label="标题" path="title">
            <NInput v-model:value="model.title" placeholder="例如：浏览题目与现场答题" />
          </NFormItemGi>
          <NFormItemGi label="分类" path="category">
            <NSelect
              v-model:value="model.category"
              :options="[
                { label: '玩法说明', value: '玩法说明' },
                { label: '答题规则', value: '答题规则' },
                { label: '内容规范', value: '内容规范' }
              ]"
            />
          </NFormItemGi>
          <NFormItemGi label="状态" path="status">
            <NRadioGroup v-model:value="model.status">
              <NSpace>
                <NRadio value="已发布">发布</NRadio>
                <NRadio value="草稿">草稿</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGi>
        </NGrid>

        <NFormItem label="摘要" path="summary">
          <NInput
            v-model:value="model.summary"
            type="textarea"
            placeholder="帮助列表展示的简短摘要"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </NFormItem>

        <NFormItem label="配图" path="cover">
          <NSpace vertical class="w-full">
            <NSwitch v-model:value="model.coverEnabled">
              <template #checked>使用配图</template>
              <template #unchecked>不使用配图</template>
            </NSwitch>
            <NUpload v-if="model.coverEnabled" :default-upload="false" list-type="image-card" accept="image/*" />
          </NSpace>
        </NFormItem>

        <NFormItem label="正文" path="content">
          <NInput
            v-model:value="model.content"
            type="textarea"
            placeholder="按段落编写正文，适合承载步骤、规则和注意事项"
            :autosize="{ minRows: 10, maxRows: 18 }"
          />
        </NFormItem>
      </NForm>
    </NCard>
  </NSpace>
</template>
