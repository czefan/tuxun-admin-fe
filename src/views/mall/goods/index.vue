<script setup lang="ts">
import { computed, h, ref } from 'vue';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
  type SelectOption,
  type UploadFileInfo
} from 'naive-ui';
import type { GoodFormPayload, GoodListItem, GoodStatus } from '@/service/api';
import { createGood, deleteGood, fetchGoods, updateGood, updateGoodStatus, updateGoodStock } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import ImageDragUploader from '@/components/advanced/image-drag-uploader.vue';
import { createDateTimeColumn, createStatusColumn, createThumbColumn } from '@/utils/table-columns';
import { confirmAction, confirmDelete } from '@/utils/confirm';

const message = useMessage();
const { isOperating, run } = useOperatingKeys();

const statusOptions: SelectOption[] = [
  { label: '上架', value: 'in_store' },
  { label: '下架', value: 'out_store' }
];

const statusTagMap: Record<string, { type: 'success' | 'default'; label: string }> = {
  in_store: { type: 'success', label: '上架' },
  out_store: { type: 'default', label: '下架' }
};

// 调整库存弹窗
const stockVisible = ref(false);
const stockTarget = ref<GoodListItem | null>(null);
const stockValue = ref<number | null>(0);

// 新建/编辑奖品弹窗
const formModalVisible = ref(false);
const formModalType = ref<'create' | 'edit'>('create');
const currentGoodId = ref<number | null>(null);
const formSubmitting = ref(false);

const imageFiles = ref<UploadFileInfo[]>([]);
const imageUrl = ref('');

const goodFormModel = ref({
  name: '',
  description: '',
  score_price: 100
});

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<GoodListItem, { keyword: string; status: GoodStatus | null }>({
    fetchApi: async params => {
      const { data: res, error } = await fetchGoods({
        page: params.page,
        page_size: params.page_size,
        keyword: params.keyword?.trim() ? params.keyword.trim().slice(0, 50) : undefined,
        status: params.status || undefined
      });
      return { data: { list: res?.list || [], total: res?.total || 0 }, error };
    },
    initialParams: { keyword: '', status: null }
  });

function openCreateModal() {
  formModalType.value = 'create';
  currentGoodId.value = null;
  imageUrl.value = '';
  imageFiles.value = [];
  goodFormModel.value = {
    name: '',
    description: '',
    score_price: 100
  };
  formModalVisible.value = true;
}

function openEditModal(row: GoodListItem) {
  formModalType.value = 'edit';
  currentGoodId.value = row.id;
  imageUrl.value = row.image_url || row.thumb_url || '';
  imageFiles.value = [];
  goodFormModel.value = {
    name: row.name || '',
    description: row.description || '',
    score_price: row.score_price ?? 0
  };
  formModalVisible.value = true;
}

function validateGoodForm() {
  if (!goodFormModel.value.name.trim()) return '请输入奖品名称';
  if (goodFormModel.value.name.trim().length > 20) return '奖品名称不能超过 20 个字';
  if (goodFormModel.value.description.trim().length > 50) return '奖品描述不能超过 50 个字';
  if (goodFormModel.value.score_price === null || goodFormModel.value.score_price < 0) return '请输入有效的所需积分';
  if (goodFormModel.value.score_price > 999999) return '所需积分不能超过 999,999';

  const hasImage = imageFiles.value.length > 0 || Boolean(imageUrl.value);
  if (!hasImage) return '请上传奖品图片';
  const file = imageFiles.value[0]?.file;
  if (file && !['image/jpeg', 'image/png'].includes(file.type)) return '奖品图片仅支持 jpg/png 格式';
  if (file && file.size > 20 * 1024 * 1024) return '奖品图片不能超过 20MB';
  return '';
}

function handleFormSubmit() {
  const errMsg = validateGoodForm();
  if (errMsg) {
    message.warning(errMsg);
    return;
  }

  const isCreate = formModalType.value === 'create';
  confirmAction({
    title: isCreate ? '确认新建奖品' : '确认编辑奖品',
    content: isCreate
      ? `确认新建奖品「${goodFormModel.value.name.trim()}」？`
      : `确认保存奖品「${goodFormModel.value.name.trim()}」的修改？`,
    positiveText: isCreate ? '确认新建' : '保存修改',
    onConfirm: doFormSubmit
  });
}

async function doFormSubmit() {
  const payload: GoodFormPayload = {
    name: goodFormModel.value.name.trim(),
    description: goodFormModel.value.description.trim(),
    score_price: goodFormModel.value.score_price,
    image: imageFiles.value[0]?.file || undefined
  };

  formSubmitting.value = true;
  try {
    const res =
      formModalType.value === 'create' ? await createGood(payload) : await updateGood(currentGoodId.value!, payload);

    if (res.data) {
      message.success(formModalType.value === 'create' ? '新建奖品成功' : '编辑奖品成功');
      formModalVisible.value = false;
      await loadData();
    }
  } catch {
    message.error('操作失败，请重试');
  } finally {
    formSubmitting.value = false;
  }
}

function confirmStatus(row: GoodListItem) {
  if (isOperating(row.id)) return;
  const nextStatus: GoodStatus = row.status === 'in_store' ? 'out_store' : 'in_store';
  confirmAction({
    title: nextStatus === 'in_store' ? '确认上架奖品' : '确认下架奖品',
    content: `确认将「${row.name}」${nextStatus === 'in_store' ? '上架' : '下架'}？`,
    onConfirm: () => changeStatus(row, nextStatus)
  });
}

function changeStatus(row: GoodListItem, status: GoodStatus) {
  return run(row.id, async () => {
    try {
      const res = await updateGoodStatus(row.id, status);
      if (res.error) {
        window.$message?.error(res.error.message || '更新状态失败');
        return;
      }
      window.$message?.success(status === 'in_store' ? '上架成功' : '下架成功');
      await loadData();
    } catch {
      window.$message?.error('操作出错，请重试');
    }
  });
}

function openStockModal(row: GoodListItem) {
  stockTarget.value = row;
  stockValue.value = row.stock;
  stockVisible.value = true;
}

function confirmSubmitStock() {
  if (!stockTarget.value) return;
  if (stockValue.value === null || stockValue.value < 0) {
    message.warning('请输入有效的库存数量');
    return;
  }
  if (stockValue.value > 99999) {
    message.warning('库存数量不能超过 99,999');
    return;
  }
  const targetName = stockTarget.value.name;
  const newStock = stockValue.value;
  confirmAction({
    title: '确认调整库存',
    content: `确认将奖品「${targetName}」的库存调整为 ${newStock}？`,
    positiveText: '确认调整',
    onConfirm: submitStock
  });
}

async function submitStock() {
  if (!stockTarget.value || stockValue.value === null) return;
  const id = stockTarget.value.id;
  await run(id, async () => {
    try {
      const res = await updateGoodStock(id, stockValue.value!);
      if (res.error) {
        window.$message?.error(res.error.message || '修改库存失败');
        return;
      }
      window.$message?.success('库存已修改');
      stockVisible.value = false;
      await loadData();
    } catch {
      window.$message?.error('操作出错，请重试');
    }
  });
}

function confirmRemove(row: GoodListItem) {
  if (isOperating(row.id)) return;
  confirmDelete(`奖品「${row.name}」`, () => removeGood(row));
}

function removeGood(row: GoodListItem) {
  return run(row.id, async () => {
    try {
      const res = await deleteGood(row.id);
      if (res.error) {
        window.$message?.error(res.error.message || '删除失败');
        return;
      }
      window.$message?.success('删除成功');
      await loadData();
    } catch {
      window.$message?.error('删除出错，请重试');
    }
  });
}

const columns = computed<DataTableColumns<GoodListItem>>(() => [
  createThumbColumn<GoodListItem>(),
  {
    title: '奖品',
    key: 'info',
    minWidth: 180,
    render(row) {
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium text-14px text-gray-900 dark:text-gray-100' }, `#${row.id} ${row.name}`),
        h('div', { class: 'text-12px text-gray-500 line-clamp-2' }, row.description || '无描述')
      ]);
    }
  },
  {
    title: '积分',
    key: 'score_price',
    width: 75,
    render(row) {
      return h('span', { class: 'font-medium text-gray-900 dark:text-gray-100' }, String(row.score_price));
    }
  },
  {
    title: '库存',
    key: 'stock',
    width: 75,
    render(row) {
      return h(NTag, { type: row.stock > 0 ? 'info' : 'error', size: 'small' }, { default: () => String(row.stock) });
    }
  },
  createStatusColumn<GoodListItem>(statusTagMap),
  createDateTimeColumn<GoodListItem>(),
  {
    title: '操作',
    key: 'actions',
    width: 130,
    render(row) {
      const isInStore = row.status === 'in_store';
      return h('div', { class: 'grid grid-cols-2 gap-4px w-110px' }, [
        h(
          NButton,
          { size: 'small', type: 'primary', secondary: true, onClick: () => openEditModal(row) },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, onClick: () => openStockModal(row) },
          { default: () => '库存' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: isInStore ? 'warning' : 'success',
            secondary: true,
            onClick: () => confirmStatus(row)
          },
          { default: () => (isInStore ? '下架' : '上架') }
        ),
        h(
          NButton,
          { size: 'small', type: 'error', secondary: true, onClick: () => confirmRemove(row) },
          { default: () => '删除' }
        )
      ]);
    }
  }
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="奖品管理"
      description="已有兑换记录的奖品无法物理删除，仅可下架处理。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #filters>
        <NSelect
          v-model:value="searchParams.status"
          :options="statusOptions"
          class="w-160px"
          clearable
          placeholder="全部 (上下架状态)"
          @update:value="handleSearch"
        />
      </template>

      <NInput
        v-model:value="searchParams.keyword"
        class="flex-1 w-full"
        clearable
        maxlength="50"
        placeholder="奖品ID、名称、描述"
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

    <!-- 新建/编辑奖品弹窗 -->
    <NModal
      v-model:show="formModalVisible"
      preset="card"
      :title="formModalType === 'create' ? '新建奖品' : `编辑奖品 #${currentGoodId}`"
      class="max-w-md"
    >
      <NForm label-placement="left" label-width="90">
        <NFormItem label="奖品名称" required>
          <NInput
            v-model:value="goodFormModel.name"
            maxlength="20"
            show-count
            placeholder="请输入奖品名称 (最多 20 字)"
          />
        </NFormItem>
        <NFormItem label="奖品描述">
          <NInput
            v-model:value="goodFormModel.description"
            type="textarea"
            maxlength="50"
            show-count
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入奖品描述 (最多 50 字)"
          />
        </NFormItem>
        <NFormItem label="所需积分" required>
          <NInputNumber
            v-model:value="goodFormModel.score_price"
            :min="0"
            :precision="0"
            class="w-full"
            placeholder="请输入兑换所需的积分"
          />
        </NFormItem>
        <NFormItem label="奖品图片" required>
          <ImageDragUploader v-model:file-list="imageFiles" :image-url="imageUrl" width="160" height="160" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="formModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="formSubmitting" @click="handleFormSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 调整库存弹窗 -->
    <NModal v-model:show="stockVisible" preset="card" title="调整库存" style="width: 400px">
      <NSpace vertical :size="12">
        <div>
          目标奖品：
          <span class="font-semibold">{{ stockTarget?.name }}</span>
        </div>
        <NInputNumber
          v-model:value="stockValue"
          :min="0"
          :precision="0"
          placeholder="请输入新库存数量"
          class="w-full"
        />
      </NSpace>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="stockVisible = false">取消</NButton>
          <NButton type="primary" @click="confirmSubmitStock">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
