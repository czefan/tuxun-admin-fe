<script setup lang="ts">
import { reactive } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const model = reactive({
  title: '',
  type: '活动',
  target: '全体用户',
  channels: ['站内通知', '消息中心'],
  coverEnabled: false,
  content: ''
});

function backToList() {
  routerPushByKey('notice_list');
}

function saveNotice() {
  window.$message?.success('通知草稿已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">新建通知</h2>
          <p class="mt-6px text-13px text-#777">编辑通知标题、正文排版、发送对象和触达渠道。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveNotice">保存草稿</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_360px]">
      <NCard :bordered="false" class="card-wrapper">
        <NForm :model="model" label-placement="top">
          <NGrid :cols="2" :x-gap="16">
            <NFormItemGi label="通知标题" path="title">
              <NInput v-model:value="model.title" placeholder="标题会显示在消息列表和弹窗顶部" />
            </NFormItemGi>
            <NFormItemGi label="通知类型" path="type">
              <NSelect
                v-model:value="model.type"
                :options="[
                  { label: '系统', value: '系统' },
                  { label: '活动', value: '活动' },
                  { label: '审核', value: '审核' },
                  { label: '积分', value: '积分' }
                ]"
              />
            </NFormItemGi>
            <NFormItemGi label="发送对象" path="target">
              <NSelect
                v-model:value="model.target"
                :options="[
                  { label: '全体用户', value: '全体用户' },
                  { label: '管理员', value: '管理员' },
                  { label: '参与活动用户', value: '参与活动用户' }
                ]"
              />
            </NFormItemGi>
            <NFormItemGi label="发送渠道" path="channels">
              <NCheckboxGroup v-model:value="model.channels">
                <NSpace>
                  <NCheckbox value="站内通知">站内通知</NCheckbox>
                  <NCheckbox value="系统弹窗">系统弹窗</NCheckbox>
                  <NCheckbox value="消息中心">消息中心</NCheckbox>
                </NSpace>
              </NCheckboxGroup>
            </NFormItemGi>
          </NGrid>

          <NFormItem label="正文配图" path="cover">
            <NSpace vertical class="w-full">
              <NSwitch v-model:value="model.coverEnabled">
                <template #checked>使用图片</template>
                <template #unchecked>纯文字</template>
              </NSwitch>
              <NUpload v-if="model.coverEnabled" :default-upload="false" list-type="image-card" accept="image/*" />
            </NSpace>
          </NFormItem>

          <NFormItem label="通知正文" path="content">
            <NInput
              v-model:value="model.content"
              type="textarea"
              placeholder="支持按段落编写通知内容，发送前请检查标题、时间、活动名称和用户动作是否清晰"
              :autosize="{ minRows: 10, maxRows: 16 }"
            />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">弹窗预览</h3>
        <div class="rounded-6px border border-#e5e7eb border-solid p-16px">
          <p class="m-0 text-17px font-semibold">{{ model.title || '通知标题' }}</p>
          <p class="mt-8px text-13px text-#777">{{ model.type }} · {{ model.target }}</p>
          <div v-if="model.coverEnabled" class="mt-14px h-120px rounded-6px bg-#eef4f8" />
          <p class="mt-14px whitespace-pre-line text-14px leading-7 text-#333">
            {{ model.content || '通知正文将在这里预览，适合检查段落长度和弹窗阅读体验。' }}
          </p>
        </div>
      </NCard>
    </div>
  </NSpace>
</template>
