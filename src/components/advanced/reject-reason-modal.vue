<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal, NSpace } from 'naive-ui';

/**
 * 审核驳回 / 拒绝类操作的原因填写弹窗。
 *
 * 只负责弹窗外壳、输入与必填校验，实际提交由父级在 `submit` 事件里做，
 * 提交期间由父级通过 `loading` 控制按钮态。
 */
const {
  label = '驳回原因',
  placeholder = '请输入具体的驳回原因',
  required = true,
  maxlength = 50,
  labelWidth = 90
} = defineProps<{
  /** 弹窗标题，如「驳回投稿审核」 */
  title: string;
  /** 输入项标签，同时用于必填校验的提示文案 */
  label?: string;
  placeholder?: string;
  /** 是否必填；为 false 时允许留空提交 */
  required?: boolean;
  maxlength?: number;
  labelWidth?: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', reason: string): void;
}>();

const show = defineModel<boolean>('show', { default: false });

const reason = ref('');

// 每次打开都重置，避免上一条的内容残留到下一条
watch(show, visible => {
  if (visible) reason.value = '';
});

function handleSubmit() {
  const value = reason.value.trim();
  if (required && !value) {
    window.$message?.warning(`请输入${label}`);
    return;
  }
  emit('submit', value);
}
</script>

<template>
  <NModal v-model:show="show" preset="card" :title="title" style="width: 440px">
    <NForm label-placement="left" :label-width="labelWidth" :show-feedback="false">
      <NFormItem :label="label" :required="required">
        <NInput
          v-model:value="reason"
          type="textarea"
          :placeholder="`${placeholder} (最多 ${maxlength} 字)...`"
          :maxlength="maxlength"
          show-count
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">取消</NButton>
        <NButton type="error" secondary :loading="loading" @click="handleSubmit">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
