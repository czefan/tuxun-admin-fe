<script setup lang="ts">
import { computed, h } from 'vue';
import { NAlert, NAvatar, NButton, NCard, NDropdown, NImage, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { searchUsers, updateAdminLevel, updateUserStatus } from '@/service/api/admin';
import type { UserStatus, UserSummary } from '@/service/api/types';
import { useAuthStore } from '@/store/modules/auth';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import { createStatusColumn } from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const authStore = useAuthStore();
const { isOperating, run } = useOperatingKeys();

const userStatusMap: Record<string, { type: 'error' | 'success'; label: string }> = {
  active: { type: 'success', label: '正常' },
  banned: { type: 'error', label: '已封禁' }
};

const statusSelectOptions = [
  { label: '正常账号', value: 'active' },
  { label: '封禁账号', value: 'banned' }
];

const levelSelectOptions = [
  { label: 'Level 1 (普通用户)', value: 1 },
  { label: 'Level 2 (管理员)', value: 2 },
  { label: 'Level 3 (超级管理员)', value: 3 }
];

const levelTagMap: Record<number, { type: 'default' | 'info' | 'primary' | 'warning'; label: string }> = {
  0: { type: 'default', label: 'Level 0 (受限)' },
  1: { type: 'default', label: 'Level 1 (普通用户)' },
  2: { type: 'primary', label: 'Level 2 (管理员)' },
  3: { type: 'warning', label: 'Level 3 (超级管理员)' }
};

const levelOptions = [
  { label: 'Level 1 (普通用户)', key: 1 },
  { label: 'Level 2 (管理员)', key: 2 }
];

// 复用通用 useTableSearch Hook，非超级管理员时阻止自动发送请求
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
} = useTableSearch<UserSummary, { status: UserStatus | null; level: number | null; keyword: string }>({
  autoFetch: authStore.isSuperAdmin,
  fetchApi: async params => {
    const { data: res, error } = await searchUsers({
      page: params.page,
      page_size: params.page_size,
      keyword: params.keyword?.trim() || undefined,
      status: params.status || undefined,
      level: params.level ?? undefined
    });
    return { data: res ? { list: res.list || [], total: res.total || 0 } : null, error };
  },
  initialParams: { status: null, level: null, keyword: '' }
});

const columns = computed<DataTableColumns<UserSummary>>(() => [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '头像',
    key: 'avatar',
    width: 60,
    render(row) {
      if (!row.avatar) {
        return h(NAvatar, { round: true, size: 36 }, { default: () => (row.username || '用').slice(0, 1) });
      }
      return h(NImage, {
        src: row.avatar,
        width: 36,
        height: 36,
        objectFit: 'cover',
        class: 'rounded-full cursor-pointer shadow-xs'
      });
    }
  },
  { title: '学号 NetID', key: 'netid', width: 110 },
  { title: '姓名', key: 'username', width: 110 },
  { title: '昵称', key: 'nickname', minWidth: 120 },
  {
    title: '管理员等级',
    key: 'level',
    width: 110,
    render(row) {
      const conf = levelTagMap[row.level] || { type: 'default', label: `Level ${row.level}` };
      return h(NTag, { type: conf.type, size: 'medium' }, { default: () => conf.label });
    }
  },
  createStatusColumn<UserSummary>(userStatusMap, { title: '账号状态' }),
  {
    title: '操作',
    key: 'actions',
    width: 110,
    fixed: 'right',
    render(row) {
      if (row.level === 3) {
        return h('span', { class: 'text-gray-400 text-12px' }, '不可治理 (Level 3)');
      }

      const operating = isOperating(row.id);
      const isBanned = row.status === 'banned';

      const availableLevelOptions = levelOptions
        .filter(opt => opt.key !== row.level)
        .map(opt => ({ label: `改为 ${opt.label}`, key: opt.key }));

      return h(NSpace, { size: 'small', wrap: false }, () => [
        h(
          NDropdown,
          {
            options: availableLevelOptions,
            disabled: operating,
            onSelect: (key: number) => confirmLevelChange(row, key)
          },
          {
            default: () =>
              h(
                NButton,
                { size: 'small', secondary: true, loading: operating, disabled: operating },
                { default: () => '等级' }
              )
          }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: isBanned ? 'success' : 'error',
            secondary: true,
            loading: operating,
            disabled: operating,
            onClick: () => confirmStatusChange(row)
          },
          { default: () => (isBanned ? '解封' : '封禁') }
        )
      ]);
    }
  }
]);

function confirmStatusChange(user: UserSummary) {
  if (isOperating(user.id)) return;
  const isBanned = user.status === 'banned';
  const targetStatus: UserStatus = isBanned ? 'active' : 'banned';
  confirmAction({
    title: isBanned ? '确认解封用户' : '确认封禁用户',
    content: `确认要将用户 [${user.username || user.netid}] 更改为${isBanned ? '解封' : '封禁'}状态？`,
    tone: isBanned ? 'warning' : 'error',
    positiveText: isBanned ? '确认解封' : '确认封禁',
    onConfirm: () => handleStatusChange(user, targetStatus)
  });
}

function confirmLevelChange(user: UserSummary, target_level: number) {
  if (user.level === target_level || isOperating(user.id)) return;
  if (target_level !== 1 && target_level !== 2) {
    window.$message?.warning('管理员等级只允许在 Level 1 与 Level 2 之间调整');
    return;
  }
  confirmAction({
    title: '确认调整管理员等级',
    content: `确认将用户 [${user.username || user.netid}] 的管理员等级调整为 Level ${target_level}？`,
    positiveText: '确认调整',
    onConfirm: () => handleLevelChange(user, target_level as 1 | 2)
  });
}

function handleStatusChange(user: UserSummary, status: UserStatus) {
  return run(user.id, async () => {
    const res = await updateUserStatus(user.id, status);
    if (!res.error) {
      window.$message?.success(res.response?.data?.message || '更新状态成功');
    }
    await loadData();
  });
}

function handleLevelChange(user: UserSummary, target_level: 1 | 2) {
  return run(user.id, async () => {
    const res = await updateAdminLevel(user.id, target_level);
    if (!res.error) {
      window.$message?.success(res.response?.data?.message || '调整等级成功');
    }
    await loadData();
  });
}
</script>

<template>
  <NSpace vertical :size="16">
    <template v-if="!authStore.isSuperAdmin">
      <NCard :bordered="false" class="card-wrapper">
        <NAlert type="error" title="权限不足，仅超级管理员 (Level 3) 可访问" />
      </NCard>
    </template>

    <template v-else>
      <TableSearchBar
        title="用户管理"
        description="不可对超级管理员 (Level 3) 账号封禁或调级；等级调整仅允许在 Level 1 与 Level 2 之间切换。"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
      >
        <template #filters>
          <NSelect
            v-model:value="searchParams.status"
            :options="statusSelectOptions"
            placeholder="全部 (账号状态)"
            class="w-160px"
            clearable
            @update:value="handleSearch"
          />
          <NSelect
            v-model:value="searchParams.level"
            :options="levelSelectOptions"
            placeholder="全部 (权限身份)"
            class="w-170px"
            clearable
            @update:value="handleSearch"
          />
        </template>

        <NInput
          v-model:value="searchParams.keyword"
          maxlength="50"
          placeholder="ID、学号、姓名、昵称"
          clearable
          class="flex-1 w-full"
          @keyup.enter="handleSearch"
        />
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
    </template>
  </NSpace>
</template>
