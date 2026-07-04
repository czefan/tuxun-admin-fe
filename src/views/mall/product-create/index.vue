<script setup lang="ts">
import { reactive } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

const model = reactive({
  name: '',
  category: '活动周边',
  points: 1000,
  stock: 10,
  status: '上架',
  exchangeLimit: '',
  description: '',
  specs: ''
});

function backToList() {
  routerPushByKey('mall_product');
}

function saveProduct() {
  window.$message?.success('商品已保存');
  backToList();
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">新增商品</h2>
          <p class="mt-6px text-13px text-#777">维护商品图片、兑换积分、库存和详情说明。</p>
        </div>
        <NSpace>
          <NButton @click="backToList">取消</NButton>
          <NButton type="primary" @click="saveProduct">保存商品</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_360px]">
      <NCard :bordered="false" class="card-wrapper">
        <NForm :model="model" label-placement="top">
          <NGrid :cols="2" :x-gap="16">
            <NFormItemGi label="商品名称" path="name">
              <NInput v-model:value="model.name" placeholder="例如：挑战钥匙扣" />
            </NFormItemGi>
            <NFormItemGi label="商品分类" path="category">
              <NSelect
                v-model:value="model.category"
                :options="[
                  { label: '活动周边', value: '活动周边' },
                  { label: '优惠券', value: '优惠券' },
                  { label: '实体奖品', value: '实体奖品' }
                ]"
              />
            </NFormItemGi>
            <NFormItemGi label="所需积分" path="points">
              <NInputNumber v-model:value="model.points" class="w-full" :min="0" :step="100" />
            </NFormItemGi>
            <NFormItemGi label="库存" path="stock">
              <NInputNumber v-model:value="model.stock" class="w-full" :min="0" />
            </NFormItemGi>
            <NFormItemGi label="状态" path="status">
              <NRadioGroup v-model:value="model.status">
                <NSpace>
                  <NRadio value="上架">上架</NRadio>
                  <NRadio value="下架">下架</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItemGi>
            <NFormItemGi label="兑换限制" path="exchangeLimit">
              <NInput v-model:value="model.exchangeLimit" placeholder="例如：每位用户每期最多兑换 1 件" />
            </NFormItemGi>
          </NGrid>

          <NFormItem label="商品图片" path="image">
            <NUpload :default-upload="false" list-type="image-card" accept="image/*" />
          </NFormItem>

          <NFormItem label="商品说明" path="description">
            <NInput
              v-model:value="model.description"
              type="textarea"
              placeholder="前台详情页展示的商品说明、领取方式和注意事项"
              :autosize="{ minRows: 5, maxRows: 10 }"
            />
          </NFormItem>

          <NFormItem label="规格参数" path="specs">
            <NInput
              v-model:value="model.specs"
              type="textarea"
              placeholder="每行一项，例如：材质：金属挂件"
              :autosize="{ minRows: 4, maxRows: 8 }"
            />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">上架检查</h3>
        <NSpace vertical :size="10">
          <NAlert type="info" :show-icon="false">商品图建议使用 4:3 或 16:9，避免透明底导致前台展示不清晰。</NAlert>
          <NDescriptions :column="1" bordered label-placement="left">
            <NDescriptionsItem label="所需积分">{{ model.points }}</NDescriptionsItem>
            <NDescriptionsItem label="库存">{{ model.stock }}</NDescriptionsItem>
            <NDescriptionsItem label="状态">{{ model.status }}</NDescriptionsItem>
          </NDescriptions>
        </NSpace>
      </NCard>
    </div>
  </NSpace>
</template>
