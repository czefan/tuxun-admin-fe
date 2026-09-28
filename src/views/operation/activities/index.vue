<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toImageVM } from '@/service/contract/types';
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
  type UploadFileInfo
} from 'naive-ui';
import dayjs from 'dayjs';
import type { ActivityFormPayload, ActivityListItem } from '@/service/api';
import { createActivity, fetchAdminActivityList, updateActivity } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import ImageDragUploader from '@/components/advanced/image-drag-uploader.vue';
import { getActivityStatus } from '@/utils/tuxun';
import { createDateTimeColumn, createThumbColumn } from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const router = useRouter();
const message = useMessage();

const activityStatusMap: Record<string, { type: 'info' | 'success' | 'default'; label: string }> = {
  not_started: { type: 'info', label: '未开始' },
  active: { type: 'success', label: '进行中' },
  ended: { type: 'default', label: '已结束' }
};

const statusOptions = [
  { label: '未开始', value: 'not_started' },
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' }
];

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<ActivityListItem, { keyword: string; status: 'not_started' | 'active' | 'ended' | null }>({
    fetchApi: params =>
      fetchAdminActivityList({
        page: params.page,
        page_size: params.page_size,
        status: params.status || undefined,
        keyword: params.keyword?.trim() ? params.keyword.trim().slice(0, 50) : undefined
      }),
    initialParams: { keyword: '', status: null }
  });

function openQuestions(id: number) {
  router.push(`/operation/questions?activity_ids=${id}`);
}

// 弹窗表单状态
const modalVisible = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentActivityId = ref<number | null>(null);
const originalEndTime = ref<number | null>(null);
const timeLocked = computed(
  () => modalType.value === 'edit' && originalEndTime.value !== null && originalEndTime.value <= Date.now()
);
const submitting = ref(false);
const imageProcessing = ref(false);

const coverFiles = ref<UploadFileInfo[]>([]);
const coverUrl = ref('');

const formModel = ref({
  title: '',
  description: '',
  startTime: null as number | null,
  endTime: null as number | null
});

function openCreateModal() {
  modalType.value = 'create';
  currentActivityId.value = null;
  originalEndTime.value = null;
  coverUrl.value = '';
  coverFiles.value = [];
  formModel.value = {
    title: '',
    description: '',
    startTime: dayjs().valueOf(),
    endTime: dayjs().add(7, 'day').valueOf()
  };
  modalVisible.value = true;
}

function openEditModal(row: ActivityListItem) {
  modalType.value = 'edit';
  currentActivityId.value = row.id;
  originalEndTime.value = dayjs(row.end_time).valueOf();
  coverUrl.value = toImageVM(row.cover_image, 'origin').url;
  coverFiles.value = [];
  formModel.value = {
    title: row.title || '',
    description: row.description || '',
    startTime: row.start_time ? dayjs(row.start_time).valueOf() : null,
    endTime: row.end_time ? dayjs(row.end_time).valueOf() : null
  };
  modalVisible.value = true;
}

function validateForm() {
  if (!formModel.value.title.trim()) return '请填写活动标题';
  if (formModel.value.title.trim().length > 20) return '活动标题不能超过 20 个字';
  if (!formModel.value.description.trim()) return '请填写活动描述';
  if (formModel.value.description.trim().length > 100) return '活动描述不能超过 100 个字';
  if (!formModel.value.startTime || !formModel.value.endTime) return '请选择活动开始和结束时间';
  if (formModel.value.endTime <= formModel.value.startTime) return '结束时间必须晚于开始时间';

  const hasCover = coverFiles.value.length > 0 || Boolean(coverUrl.value);
  if (!hasCover) return '请上传活动封面图片';
  const file = coverFiles.value[0]?.file;
  if (file && !['image/jpeg', 'image/png'].includes(file.type)) return '封面图片仅支持 jpg/png 格式';
  if (file && file.size > 20 * 1024 * 1024) return '封面图片不能超过 20MB';
  return '';
}

function handleSubmit() {
  const errMsg = validateForm();
  if (errMsg) {
    message.warning(errMsg);
    return;
  }

  const isCreate = modalType.value === 'create';
  confirmAction({
    title: isCreate ? '确认新建活动' : '确认保存修改',
    content: isCreate
      ? `确认新建活动「${formModel.value.title.trim()}」？`
      : `确认保存活动「${formModel.value.title.trim()}」的修改？`,
    positiveText: isCreate ? '确认新建' : '保存修改',
    onConfirm: doSubmit
  });
}

async function doSubmit() {
  if (submitting.value || imageProcessing.value) return false;

  const payload: Partial<ActivityFormPayload> = {
    title: formModel.value.title.trim(),
    description: formModel.value.description.trim(),
    start_time: timeLocked.value ? undefined : dayjs(formModel.value.startTime).format('YYYY-MM-DDTHH:mm:ssZ'),
    end_time: timeLocked.value ? undefined : dayjs(formModel.value.endTime).format('YYYY-MM-DDTHH:mm:ssZ'),
    cover_file: coverFiles.value[0]?.file || undefined
  };

  submitting.value = true;
  try {
    const res =
      modalType.value === 'create'
        ? await createActivity(payload as ActivityFormPayload)
        : await updateActivity(currentActivityId.value!, payload);

    if (res.data) {
      message.success(modalType.value === 'create' ? '活动新建成功' : '活动更新成功');
      modalVisible.value = false;
      loadData();
      return true;
    }
    if (res.error) {
      message.error(res.error.message || '操作失败，请重试');
      return false;
    }
    return false;
  } catch {
    message.error('操作失败，请重试');
    return false;
  } finally {
    submitting.value = false;
  }
}

const columns = computed<DataTableColumns<ActivityListItem>>(() => [
  createThumbColumn<ActivityListItem>({ title: '封面', key: 'cover_image', width: 90, imageSize: 56 }),
  {
    title: '活动',
    key: 'info',
    minWidth: 200,
    render(row) {
      const count = row.photo_count ?? 0;
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium text-14px text-gray-900 dark:text-gray-100' }, [
          `#${row.id} ${row.title}`,
          h('span', { class: 'text-gray-500 dark:text-gray-400 font-normal ml-4px' }, `(${count} 题)`)
        ]),
        h('div', { class: 'text-12px text-gray-500 line-clamp-2' }, row.description || '无描述')
      ]);
    }
  },
  createDateTimeColumn<ActivityListItem>({ title: '开始时间', key: 'start_time' }),
  createDateTimeColumn<ActivityListItem>({ title: '结束时间', key: 'end_time' }),
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row) {
      const status = getActivityStatus(row);
      const conf = activityStatusMap[status] || { type: 'default', label: status };
      return h(NTag, { type: conf.type, size: 'medium' }, { default: () => conf.label });
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 75,
    render(row) {
      return h('div', { class: 'flex flex-col gap-6px w-full items-center' }, [
        h(
          NButton,
          { size: 'small', type: 'primary', secondary: true, class: 'w-full', onClick: () => openEditModal(row) },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, class: 'w-full', onClick: () => openQuestions(row.id) },
          { default: () => '题目' }
        )
      ]);
    }
  }
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="活动管理"
      description="活动结束后将自动公开题目答案坐标，因此结束状态不可更改时间；仅进行中时允许普通用户投稿与答题。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <NSelect
        v-model:value="searchParams.status"
        :options="statusOptions"
        placeholder="全部 (活动状态)"
        clearable
        class="w-160px flex-shrink-0"
        @update:value="handleSearch"
      />
      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        class="flex-1 min-w-0"
        clearable
        placeholder="活动ID、标题、描述"
        @keyup.enter="handleSearch"
      />

      <template #extra>
        <NButton type="primary" @click="openCreateModal">新建</NButton>
      </template>
    </TableSearchBar>

    <DataTableContainer
      :columns="columns"
      :data="rows"
      :loading="loading"
      :load-error="loadError"
      :error-message="errorMessage"
      :row-key="row => row.id"
      :pagination="pagination"
      @retry="loadData"
    />

    <!-- 新建/编辑活动弹窗 -->
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="modalType === 'create' ? '新建活动' : `编辑活动 #${currentActivityId}`"
      class="max-w-xl"
    >
      <NForm label-placement="left" label-width="90">
        <NFormItem label="活动标题" required>
          <NInput v-model:value="formModel.title" maxlength="20" show-count placeholder="请输入活动标题 (最多 20 字)" />
        </NFormItem>
        <NFormItem label="活动描述" required>
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            maxlength="100"
            show-count
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入活动描述 (最多 100 字)"
          />
        </NFormItem>
        <NFormItem label="活动封面" required>
          <ImageDragUploader
            v-model:file-list="coverFiles"
            v-model:processing="imageProcessing"
            :image-url="coverUrl"
            width="220"
            height="130"
            @remove="coverUrl = ''"
          />
        </NFormItem>
        <NFormItem label="开始时间" required>
          <NDatePicker
            v-model:value="formModel.startTime"
            :disabled="timeLocked"
            type="datetime"
            clearable
            class="w-full"
          />
        </NFormItem>
        <NFormItem label="结束时间" required>
          <NDatePicker
            v-model:value="formModel.endTime"
            :disabled="timeLocked"
            type="datetime"
            clearable
            class="w-full"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" :loading="submitting" :disabled="imageProcessing" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
