<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const formRef = ref();

const model = reactive({
  title: '',
  author: '官方管理员',
  location: '',
  address: '',
  latitude: 31.23058,
  longitude: 121.47374,
  radiusMeters: 50,
  description: '',
  answerTips: ''
});

function backToList() {
  routerPushByKey('activity_question');
}

function saveDraft() {
  window.$message?.success('题目草稿已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">新建题目</h2>
          <p class="mt-6px text-13px text-#777">配置官方题目图片、机位描述和定位校验范围。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveDraft">保存草稿</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_360px]">
      <NCard :bordered="false" class="card-wrapper">
        <NForm ref="formRef" :model="model" label-placement="top">
          <NGrid :cols="2" :x-gap="16">
            <NFormItemGi label="题目名称" path="title">
              <NInput v-model:value="model.title" placeholder="例如：校园门口机位" />
            </NFormItemGi>
            <NFormItemGi label="作者" path="author">
              <NInput v-model:value="model.author" placeholder="请输入作者名称" />
            </NFormItemGi>
            <NFormItemGi label="机位位置" path="location">
              <NInput v-model:value="model.location" placeholder="例如：校园主入口" />
            </NFormItemGi>
            <NFormItemGi label="定位地址" path="address">
              <NInput v-model:value="model.address" placeholder="用于后台识别的点位地址" />
            </NFormItemGi>
            <NFormItemGi label="纬度" path="latitude">
              <NInputNumber v-model:value="model.latitude" class="w-full" :precision="6" />
            </NFormItemGi>
            <NFormItemGi label="经度" path="longitude">
              <NInputNumber v-model:value="model.longitude" class="w-full" :precision="6" />
            </NFormItemGi>
            <NFormItemGi label="允许范围" path="radiusMeters">
              <NInputNumber v-model:value="model.radiusMeters" class="w-full" :min="10" :step="5">
                <template #suffix>m</template>
              </NInputNumber>
            </NFormItemGi>
          </NGrid>

          <NFormItem label="题目图片" path="image">
            <NUpload :default-upload="false" list-type="image-card" accept="image/*" />
          </NFormItem>

          <NFormItem label="图片判定说明" path="description">
            <NInput
              v-model:value="model.description"
              type="textarea"
              placeholder="说明画面主体、参照物、边界线等判定要求"
              :autosize="{ minRows: 4, maxRows: 8 }"
            />
          </NFormItem>

          <NFormItem label="答题提示" path="answerTips">
            <NInput
              v-model:value="model.answerTips"
              type="textarea"
              placeholder="用户端可见的简短提示，避免直接暴露答案"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">发布检查</h3>
        <NSpace vertical :size="10">
          <NAlert type="info" :show-icon="false">题目图片建议横向 16:9，保留足够地标和前景参照物。</NAlert>
          <NAlert type="warning" :show-icon="false">定位半径过小会导致现场答题失败率上升。</NAlert>
          <NDescriptions :column="1" bordered label-placement="left">
            <NDescriptionsItem label="状态">草稿</NDescriptionsItem>
            <NDescriptionsItem label="默认范围">{{ model.radiusMeters }}m</NDescriptionsItem>
            <NDescriptionsItem label="作者">{{ model.author }}</NDescriptionsItem>
          </NDescriptions>
        </NSpace>
      </NCard>
    </div>
  </NSpace>
</template>
