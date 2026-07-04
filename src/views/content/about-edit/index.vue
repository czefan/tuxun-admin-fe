<script setup lang="ts">
import { reactive } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const model = reactive({
  heroTitle: '图寻',
  heroSubtitle: '围绕校园地点解密和机位破解设计的小程序活动',
  intro: '用户通过题目图片寻找真实地点，并在现场拍摄同机位照片完成挑战。',
  contactTitle: '联系我们',
  contactContent: '如需反馈活动问题，请通过小程序反馈入口提交信息。',
  linkTitle: '活动官网',
  linkUrl: ''
});

function backToList() {
  routerPushByKey('content_about');
}

function saveAbout() {
  window.$message?.success('关于页面内容已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">编辑关于我们</h2>
          <p class="mt-6px text-13px text-#777">维护前台关于页面的主视觉、介绍文字和外部链接。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveAbout">保存内容</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_380px]">
      <NCard :bordered="false" class="card-wrapper">
        <NForm :model="model" label-placement="top">
          <NGrid :cols="2" :x-gap="16">
            <NFormItemGi label="首屏标题" path="heroTitle">
              <NInput v-model:value="model.heroTitle" />
            </NFormItemGi>
            <NFormItemGi label="首屏副标题" path="heroSubtitle">
              <NInput v-model:value="model.heroSubtitle" />
            </NFormItemGi>
          </NGrid>

          <NFormItem label="首屏图片" path="heroImage">
            <NUpload :default-upload="false" list-type="image-card" accept="image/*" />
          </NFormItem>

          <NFormItem label="项目介绍" path="intro">
            <NInput
              v-model:value="model.intro"
              type="textarea"
              placeholder="用于关于页面主体介绍，建议 1-2 段"
              :autosize="{ minRows: 5, maxRows: 10 }"
            />
          </NFormItem>

          <NGrid :cols="2" :x-gap="16">
            <NFormItemGi label="联系区标题" path="contactTitle">
              <NInput v-model:value="model.contactTitle" />
            </NFormItemGi>
            <NFormItemGi label="链接标题" path="linkTitle">
              <NInput v-model:value="model.linkTitle" />
            </NFormItemGi>
          </NGrid>

          <NFormItem label="联系说明" path="contactContent">
            <NInput v-model:value="model.contactContent" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" />
          </NFormItem>

          <NFormItem label="外部链接" path="linkUrl">
            <NInput v-model:value="model.linkUrl" placeholder="https://example.com" />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">移动端排版预览</h3>
        <div class="rounded-6px border border-#e5e7eb border-solid bg-#fafafa p-16px">
          <div class="h-150px rounded-6px bg-#dfeaf1" />
          <h4 class="mb-0 mt-14px text-18px">{{ model.heroTitle }}</h4>
          <p class="mt-6px text-13px leading-6 text-#666">{{ model.heroSubtitle }}</p>
          <p class="mt-12px whitespace-pre-line text-14px leading-7 text-#333">{{ model.intro }}</p>
          <NDivider />
          <p class="m-0 text-15px font-medium">{{ model.contactTitle }}</p>
          <p class="mt-6px text-13px leading-6 text-#666">{{ model.contactContent }}</p>
        </div>
      </NCard>
    </div>
  </NSpace>
</template>
