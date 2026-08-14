<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NSelect,
  NSpace,
  NSpin,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui';
import RichTextEditor from '@/components/advanced/rich-text-editor.vue';
import { fetchContentBlock, updateContentBlock } from '@/service/api/content';
import type { ContentBlock, ContentKey } from '@/service/api/content';
import { fetchAdminAnnouncementList, fetchAllPages } from '@/service/api';
import { formatDateTime } from '@/utils/tuxun';
import { confirmAction } from '@/utils/confirm';
import { RICH_TEXT_MAX_TEXT, htmlTextLength, validateRichText } from '@/utils/sanitize';

const message = useMessage();
const activeTab = ref<ContentKey>('popup');
const loading = ref(false);
const saving = ref(false);

/** 三个内容位只有文案 / 限额 / 配色不同，结构完全一致，统一由这张表驱动 */
const BLOCKS = [
  {
    key: 'popup',
    label: '通知弹窗',
    alertType: 'info',
    alertText:
      '用于用户一进入网站或小程序时的公告弹窗展示。修改保存后版本号自动加 1，已关闭弹窗的用户将重新看到该提醒。',
    tagType: 'primary',
    fieldLabel: '弹窗富文本正文',
    placeholder: '请输入通知弹窗正文内容...',
    minHeight: '240px',
    maxText: 100
  },
  {
    key: 'score_rules',
    label: '积分规则',
    alertType: 'success',
    alertText: '用于客户端“我的积分 -> 积分规则”页面展示。',
    tagType: 'success',
    fieldLabel: '积分规则富文本正文',
    placeholder: '请输入积分规则详细内容...',
    minHeight: '280px',
    maxText: RICH_TEXT_MAX_TEXT
  },
  {
    key: 'help',
    label: '帮助中心',
    alertType: 'warning',
    alertText: '用于客户端“设置 -> 帮助中心”页面展示玩法 FAQ。',
    tagType: 'warning',
    fieldLabel: '帮助中心富文本正文',
    placeholder: '请输入帮助中心详细内容...',
    minHeight: '280px',
    maxText: RICH_TEXT_MAX_TEXT
  }
] as const;

type BlockConfig = (typeof BLOCKS)[number];

const blocks = ref<Record<ContentKey, ContentBlock>>({
  popup: { key: 'popup', content: '', related_id: null, version: 0, updated_at: null },
  score_rules: { key: 'score_rules', content: '', related_id: null, version: 0, updated_at: null },
  help: { key: 'help', content: '', related_id: null, version: 0, updated_at: null }
});

const noticeOptions = ref<{ label: string; value: number }[]>([]);

function contentLength(block: BlockConfig) {
  return htmlTextLength(blocks.value[block.key].content);
}

function isOverLimit(block: BlockConfig) {
  return Boolean(validateRichText(blocks.value[block.key].content, block.maxText));
}

async function loadNoticeOptions() {
  try {
    const { list } = await fetchAllPages(params => fetchAdminAnnouncementList(params));
    noticeOptions.value = list.map(item => ({
      label: `[#${item.id}] ${item.title}`,
      value: item.id
    }));
  } catch {
    console.error('获取通知列表失败');
  }
}

async function loadContent(key: ContentKey) {
  loading.value = true;
  try {
    const res = await fetchContentBlock(key);
    if (res.data) {
      blocks.value[key] = res.data;
    }
  } catch {
    message.error(`获取 [${key}] 内容位失败`);
  } finally {
    loading.value = false;
  }
}

function confirmSave(block: BlockConfig) {
  if (saving.value || isOverLimit(block)) return;
  confirmAction({
    title: '确认保存并发布',
    content: `确认保存并发布【${block.label}】配置？发布后立即对客户端生效。`,
    positiveText: '保存并发布',
    onConfirm: () => handleSave(block)
  });
}

async function handleSave(block: BlockConfig) {
  const target = blocks.value[block.key];

  if (!target.content.trim()) {
    message.warning('正文内容不能为空');
    return;
  }
  const limitError = validateRichText(target.content, block.maxText);
  if (limitError) {
    message.error(limitError);
    return;
  }

  saving.value = true;
  try {
    const res = await updateContentBlock(block.key, {
      content: target.content,
      related_id: block.key === 'popup' ? target.related_id || undefined : undefined
    });
    if (res.data) {
      message.success('保存并发布成功');
      await loadContent(block.key);
    }
  } catch {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

/** 切走再切回时重新拉一次，避免多人同时编辑时展示过期的 version */
function handleTabChange(value: string) {
  activeTab.value = value as ContentKey;
  loadContent(activeTab.value);
}

onMounted(() => {
  loadNoticeOptions();
  BLOCKS.forEach(block => loadContent(block.key));
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">内容位管理</h2>
          <p class="mb-0 mt-4px text-13px text-#777">所有未登录在内的全站用户公开可见。</p>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NTabs v-model:value="activeTab" type="line" animated @update:value="handleTabChange">
        <NTabPane v-for="block in BLOCKS" :key="block.key" :name="block.key" :tab="block.label">
          <NSpin :show="loading">
            <NCard :title="`编辑${block.label}`" :bordered="false" class="card-wrapper">
              <NSpace vertical :size="16">
                <NAlert :type="block.alertType" :bordered="false">{{ block.alertText }}</NAlert>

                <div class="flex items-center justify-between">
                  <NSpace align="center">
                    <NTag :type="block.tagType" size="medium" round>当前版本: v{{ blocks[block.key].version }}</NTag>
                    <span class="text-12px text-#888">
                      最近修改: {{ formatDateTime(blocks[block.key].updated_at) }}
                    </span>
                  </NSpace>
                  <NButton type="primary" :loading="saving" :disabled="isOverLimit(block)" @click="confirmSave(block)">
                    保存并发布
                  </NButton>
                </div>

                <NForm label-placement="top">
                  <NFormItem v-if="block.key === 'popup'" label="关联通知 (可选)">
                    <NSelect
                      v-model:value="blocks.popup.related_id"
                      clearable
                      filterable
                      :options="noticeOptions"
                      placeholder="选择需要跳转的通知 (可选)"
                    />
                  </NFormItem>

                  <NFormItem required>
                    <template #label>
                      <div class="flex items-center gap-2">
                        <span>{{ block.fieldLabel }}</span>
                        <span
                          class="text-12px"
                          :class="isOverLimit(block) ? 'text-red-500 font-semibold' : 'text-#888'"
                        >
                          ({{ contentLength(block) }}/{{ block.maxText }} 字，按纯文本计)
                          <span v-if="isOverLimit(block)" class="ml-1 text-red-500">(字数超限，禁止发布)</span>
                        </span>
                      </div>
                    </template>
                    <RichTextEditor
                      v-model:value="blocks[block.key].content"
                      :placeholder="block.placeholder"
                      :min-height="block.minHeight"
                    />
                  </NFormItem>
                </NForm>
              </NSpace>
            </NCard>
          </NSpin>
        </NTabPane>
      </NTabs>
    </NCard>
  </NSpace>
</template>
