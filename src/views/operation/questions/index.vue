<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { toImageVM } from '@/service/contract/types';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  useMessage
} from 'naive-ui';

import type { DataTableColumns, UploadFileInfo } from 'naive-ui';
import ImageDragUploader from '@/components/advanced/image-drag-uploader.vue';
import AmapPicker from '@/components/advanced/amap-picker.vue';
import AmapViewModal from '@/components/advanced/amap-view-modal.vue';
import { createAdminPhoto, fetchAdminActivityList, fetchAllPages, updateAdminPhoto } from '@/service/api';

import { fetchPhotoReviews } from '@/service/api/review';
import type { PhotoReviewItem } from '@/service/api/review';
import { useTableSearch } from '@/hooks/common/table-search';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import { createDateTimeColumn, createThumbColumn, renderUserInline } from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const route = useRoute();
const message = useMessage();

// 顶部搜索过滤的活动下拉可选项（包含全部活动）
const allActivityOptions = ref<{ label: string; value: number }[]>([]);
// 弹窗创建/编辑可选择的活动下拉可选项（仅未结束活动）
const activeActivityOptions = ref<{ label: string; value: number }[]>([]);
const rawActivities = ref<{ id: number; title: string; end_time: string }[]>([]);

async function loadActivities() {
  try {
    // 管理端要能给「未开始」活动加题，必须用 /admin/activity；
    // 客户端的 /activity 按规范不返回未开始活动
    const { list, truncated } = await fetchAllPages(params => fetchAdminActivityList(params));
    if (truncated) {
      console.warn('活动数量超出下拉框一次性加载上限，仅展示前 200 条');
    }

    rawActivities.value = list;
    const now = Date.now();
    allActivityOptions.value = list.map(item => ({
      label: `[#${item.id}] ${item.title}`,
      value: item.id
    }));
    activeActivityOptions.value = list
      .filter(item => new Date(item.end_time).getTime() > now)
      .map(item => ({
        label: `[#${item.id}] ${item.title}`,
        value: item.id
      }));
  } catch {
    console.error('获取活动失败');
  }
}

const {
  searchParams,
  rows: data,
  loading,
  loadError,
  errorMessage,
  loadData,
  handleSearch,
  handleReset,
  pagination
} = useTableSearch<
  PhotoReviewItem,
  { activity_ids: number[]; solved: string | null; keyword: string; user_keyword: string }
>({
  fetchApi: params =>
    fetchPhotoReviews({
      page: params.page,
      page_size: params.page_size,
      status: 'approved',
      activity_ids: params.activity_ids.length > 0 ? params.activity_ids : undefined,
      solved: params.solved === 'true' ? true : params.solved === 'false' ? false : undefined,
      keyword: params.keyword?.trim() || undefined,
      user_keyword: params.user_keyword?.trim() || undefined
    }),
  initialParams: { activity_ids: [], solved: null, keyword: '', user_keyword: '' },
  // 首次查询要等活动列表和路由带来的 activity_ids 就位，统一由本页 onMounted 触发
  autoFetch: false
});

// 新增/编辑弹窗状态
const modalVisible = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentPhotoId = ref<number | null>(null);

const formModel = ref({
  activity_id: null as number | null,
  title: '',
  description: '',
  image_file: null as File | null,
  longitude: null as number | null,
  latitude: null as number | null,
  /** 逆地理编码回显，仅用于界面展示，不提交后端 */
  address: '',
  coord_type: 'gcj02'
});

const submitting = ref(false);

// 详情预览弹窗
const detailVisible = ref(false);
const currentDetailRow = ref<PhotoReviewItem | null>(null);

function showDetail(row: PhotoReviewItem) {
  currentDetailRow.value = row;
  detailVisible.value = true;
}

const imageFiles = ref<UploadFileInfo[]>([]);
const editingImageUrl = ref('');

watch(
  imageFiles,
  files => {
    if (files.length > 0 && files[0].file) {
      formModel.value.image_file = files[0].file;
    } else {
      formModel.value.image_file = null;
    }
  },
  { deep: true }
);

function openCreateModal() {
  modalType.value = 'create';
  currentPhotoId.value = null;
  editingImageUrl.value = '';
  imageFiles.value = [];
  formModel.value = {
    activity_id: activeActivityOptions.value.length > 0 ? activeActivityOptions.value[0].value : null,
    title: '',
    description: '',
    image_file: null,
    longitude: 108.98374,
    latitude: 34.24623,
    address: '',
    coord_type: 'gcj02'
  };
  modalVisible.value = true;
}

function openEditModal(row: PhotoReviewItem) {
  modalType.value = 'edit';
  currentPhotoId.value = row.id;
  editingImageUrl.value = toImageVM(row.image, 'origin').url;

  imageFiles.value = [];
  formModel.value = {
    activity_id: row.activity?.id || null,
    title: row.title || '',
    description: row.description || '',
    image_file: null,
    longitude: row.location?.longitude ?? null,
    latitude: row.location?.latitude ?? null,
    address: '',
    coord_type: row.location?.coord_type ?? 'gcj02'
  };
  modalVisible.value = true;
}

function handleSubmit() {
  if (!formModel.value.activity_id) {
    message.warning('请选择所属活动');
    return;
  }
  const selectedAct = rawActivities.value.find(item => item.id === formModel.value.activity_id);
  if (selectedAct && new Date(selectedAct.end_time).getTime() <= Date.now()) {
    message.warning('不能为已结束的活动新增题目');
    return;
  }
  if (!formModel.value.title.trim()) {
    message.warning('请输入题目标题');
    return;
  }
  if (formModel.value.title.trim().length > 20) {
    message.warning('题目标题不能超过 20 个字');
    return;
  }
  if (modalType.value === 'create' && !formModel.value.image_file) {
    message.warning('新增题目必须上传图片');
    return;
  }

  const isCreate = modalType.value === 'create';
  confirmAction({
    title: isCreate ? '确认新增题目' : '确认修改题目',
    content: isCreate
      ? `确认新增题目「${formModel.value.title.trim()}」？`
      : `确认修改题目「${formModel.value.title.trim()}」？`,
    positiveText: isCreate ? '确认新增' : '确认修改',
    onConfirm: doSubmit
  });
}

async function doSubmit() {
  submitting.value = true;
  try {
    if (modalType.value === 'create') {
      const res = await createAdminPhoto({
        activity_id: formModel.value.activity_id!,
        title: formModel.value.title,
        description: formModel.value.description,
        image_file: formModel.value.image_file || undefined,
        longitude: formModel.value.longitude ?? undefined,
        latitude: formModel.value.latitude ?? undefined,
        coord_type: formModel.value.coord_type
      });
      if (res.data) {
        message.success('新增题目成功');
        modalVisible.value = false;
        loadData();
      }
    } else if (modalType.value === 'edit' && currentPhotoId.value) {
      const res = await updateAdminPhoto(currentPhotoId.value, {
        title: formModel.value.title,
        description: formModel.value.description,
        image_file: formModel.value.image_file || undefined,
        longitude: formModel.value.longitude ?? undefined,
        latitude: formModel.value.latitude ?? undefined,
        coord_type: formModel.value.coord_type
      });
      if (res.data) {
        message.success('修改题目成功');
        modalVisible.value = false;
        loadData();
      }
    }
  } catch {
    message.error('操作失败');
  } finally {
    submitting.value = false;
  }
}

// 表格列定义
const columns = computed<DataTableColumns<PhotoReviewItem>>(() => [
  createThumbColumn<PhotoReviewItem>({ key: 'image' }),
  {
    title: '题目信息',
    key: 'info',
    minWidth: 180,
    render(row) {
      const authorId = row.author?.id ?? (row as any).user_id;
      const authorText = authorId ? `用户ID：${authorId}` : '图寻官方';
      return h('div', { class: 'space-y-1' }, [
        h(
          'div',
          { class: 'font-semibold text-14px text-gray-900 dark:text-gray-100 line-clamp-1' },
          `#${row.id} ${row.title || '无标题'}`
        ),
        h('div', { class: 'text-12px text-gray-500 dark:text-gray-400 line-clamp-1' }, row.description || '无描述'),
        h('div', { class: 'text-12px text-gray-400 dark:text-gray-500 line-clamp-1' }, authorText)
      ]);
    }
  },
  {
    title: '互动数据',
    key: 'stats',
    width: 110,
    render(row) {
      const solvesCount = row.solved_count ?? 0;
      return h('div', { class: 'space-y-1 text-12px' }, [
        h('div', { class: 'text-rose-500 font-medium' }, `❤️ 点赞 ${row.likes_count ?? 0}`),
        h('div', { class: 'text-blue-500 font-medium' }, `🎯 答题 ${row.attempts_count ?? 0}`),
        h('div', { class: 'text-green-600 dark:text-green-400 font-medium' }, `✅ 破解 ${solvesCount}`)
      ]);
    }
  },

  {
    title: '活动',
    key: 'activity',
    width: 120,
    render(row) {
      if (!row.activity?.id) return '未关联活动';
      return h('div', { class: 'space-y-0.5' }, [
        h('div', { class: 'text-13px font-medium text-gray-700 dark:text-gray-300' }, `#${row.activity.id}`),
        h(
          'div',
          { class: 'text-13px text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight' },
          row.activity.title || '-'
        )
      ]);
    }
  },
  createDateTimeColumn<PhotoReviewItem>({ title: '创建时间' }),
  {
    title: '操作',
    key: 'actions',
    width: 85,
    render(row) {
      return h('div', { class: 'flex flex-col gap-4px w-55px' }, [
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, onClick: () => showDetail(row) },
          { default: () => '查看' }
        ),
        h(
          NButton,
          { size: 'small', type: 'primary', secondary: true, onClick: () => openEditModal(row) },
          { default: () => '编辑' }
        )
      ]);
    }
  }
]);

onMounted(async () => {
  await loadActivities();
  const actParam = route.query.activity_ids;
  if (actParam) {
    const rawIds = Array.isArray(actParam) ? actParam : [actParam];
    const parsed = rawIds.map(v => Number(v)).filter(n => !Number.isNaN(n));
    if (parsed.length > 0) {
      searchParams.value.activity_ids = parsed;
    }
  }
  loadData();
});
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="题库管理"
      description="管理员新建题目作者固定为图寻官方且直接上线；只能给未开始或进行中的活动新增题目。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #filters>
        <div class="w-240px">
          <NSelect
            v-model:value="searchParams.activity_ids"
            multiple
            clearable
            filterable
            placeholder="选择或搜索所属活动"
            :options="allActivityOptions"
            @update:value="handleSearch"
          />
        </div>
        <div class="w-150px">
          <NSelect
            v-model:value="searchParams.solved"
            clearable
            placeholder="全部 (破解状态)"
            :options="[
              { label: '已破解', value: 'true' },
              { label: '未破解', value: 'false' }
            ]"
            @update:value="handleSearch"
          />
        </div>
        <div class="w-full">
          <NInput
            v-model:value="searchParams.user_keyword"
            maxlength="50"
            placeholder="作者ID、昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
      </template>

      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        placeholder="题目ID、标题、描述"
        clearable
        style="width: 100%"
        @keyup.enter="handleSearch"
      />

      <template #extra>
        <NButton type="primary" @click="openCreateModal">新建</NButton>
      </template>
    </TableSearchBar>

    <DataTableContainer
      :columns="columns"
      :data="data"
      :loading="loading"
      :load-error="loadError"
      :error-message="errorMessage"
      :row-key="row => row.id"
      :pagination="pagination"
      @retry="loadData"
    />

    <!-- 新增/编辑题目模态框 -->
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="modalType === 'create' ? '新增题目' : '编辑题目'"
      class="w-960px max-w-92vw"
    >
      <NForm label-placement="top">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 items-start">
          <!-- 左栏：表单基础项与图片上传 -->
          <div class="space-y-1">
            <NFormItem label="所属活动" required>
              <NSelect
                v-model:value="formModel.activity_id"
                :options="activeActivityOptions"
                filterable
                clearable
                placeholder="选择或输入活动名称/ID 搜索"
                :disabled="modalType === 'edit'"
              />
            </NFormItem>

            <NFormItem label="题目标题" required>
              <NInput
                v-model:value="formModel.title"
                maxlength="20"
                show-count
                placeholder="请输入题目标题 (最多 20 字)"
              />
            </NFormItem>

            <NFormItem label="题目描述">
              <NInput
                v-model:value="formModel.description"
                type="textarea"
                :rows="2"
                maxlength="50"
                show-count
                placeholder="请输入题目描述 (最多 50 字)"
              />
            </NFormItem>

            <NFormItem label="题目图片" required>
              <ImageDragUploader
                v-model:file-list="imageFiles"
                :image-url="modalType === 'edit' ? editingImageUrl : null"
                width="200"
                height="125"
              />
            </NFormItem>
          </div>

          <!-- 右栏：地图坐标选点 -->
          <div>
            <NFormItem label="地图坐标" required>
              <AmapPicker
                v-model:longitude="formModel.longitude"
                v-model:latitude="formModel.latitude"
                v-model:address="formModel.address"
                :height="260"
              />
            </NFormItem>
          </div>
        </div>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
        </div>
      </template>
    </NModal>

    <!-- 题目详情抽屉/模态框 -->
    <NModal v-model:show="detailVisible" preset="card" title="题目详情" class="w-840px max-w-92vw">
      <div v-if="currentDetailRow" class="space-y-4">
        <AmapViewModal
          inline
          :image-url="toImageVM(currentDetailRow.image, 'origin').url"
          :longitude="currentDetailRow.location?.longitude"
          :latitude="currentDetailRow.location?.latitude"
          marker-name="题目打卡点"
        />
        <NDescriptions
          :column="2"
          label-placement="left"
          label-style="font-weight: 500; vertical-align: middle;"
          content-style="vertical-align: middle;"
          bordered
        >
          <NDescriptionsItem label="标题" :span="2">{{ currentDetailRow.title || '无标题' }}</NDescriptionsItem>
          <NDescriptionsItem label="描述" :span="2">{{ currentDetailRow.description || '无描述' }}</NDescriptionsItem>
          <NDescriptionsItem label="作者" :span="2">
            <div class="flex items-center">
              <component :is="renderUserInline(currentDetailRow.author)" />
            </div>
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </NModal>
  </NSpace>
</template>
