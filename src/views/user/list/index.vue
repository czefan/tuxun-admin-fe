<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NSpace, NSwitch, NTag, NInput, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';

type UserRole = 'super' | 'admin' | 'user';

interface PermissionOption {
  key: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  key: string;
  label: string;
  options: PermissionOption[];
}

interface Row {
  id: string;
  nickname: string;
  studentId: string;
  points: number;
  status: string;
  role: UserRole;
  permissions: string[];
  registeredAt: string;
}

const authStore = useAuthStore();
const { routerPushByKey } = useRouterPush();

function viewUser(row: Row) {
  routerPushByKey('user_list-detail', {
    params: {
      id: row.id
    }
  });
}

const permissionGroups: PermissionGroup[] = [
  {
    key: 'review',
    label: '审核管理',
    options: [
      {
        key: 'review_question',
        label: '投稿审核',
        description: '机位题目投稿审核'
      },
      {
        key: 'review_answer',
        label: '答题审核',
        description: '答题照片和定位审核'
      }
    ]
  },
  {
    key: 'activity',
    label: '活动管理',
    options: [
      {
        key: 'activity_question',
        label: '当期题目',
        description: '当期活动题目维护'
      },
      {
        key: 'activity_list',
        label: '往期活动',
        description: '活动列表、题目和详情维护'
      }
    ]
  },
  {
    key: 'mall',
    label: '商城管理',
    options: [
      {
        key: 'mall_product',
        label: '商品管理',
        description: '商品列表、上架和编辑'
      },
      {
        key: 'mall_redemption',
        label: '奖品核销',
        description: '兑换记录和核销处理'
      },
      {
        key: 'mall_rules',
        label: '积分规则',
        description: '积分规则和历史版本'
      }
    ]
  },
  {
    key: 'notice',
    label: '通知管理',
    options: [
      {
        key: 'notice_list',
        label: '通知列表',
        description: '系统、活动、审核和积分通知'
      }
    ]
  },
  {
    key: 'content',
    label: '内容管理',
    options: [
      {
        key: 'content_feedback',
        label: '反馈管理',
        description: '用户反馈查看和处理'
      },
      {
        key: 'content_help',
        label: '帮助中心',
        description: '帮助内容发布和维护'
      },
      {
        key: 'content_about',
        label: '关于我们',
        description: '关于我们内容编辑和历史'
      }
    ]
  },
  {
    key: 'user',
    label: '用户管理',
    options: [
      {
        key: 'user_list',
        label: '用户列表',
        description: '用户列表、管理员任命和权限配置'
      }
    ]
  }
];

const allPermissionKeys = permissionGroups.flatMap(group => group.options.map(item => item.key));

const users = ref<Row[]>([
  {
    id: 'U-0001',
    nickname: '超级管理员',
    studentId: '20260001',
    points: 0,
    status: '正常',
    role: 'super',
    permissions: [...allPermissionKeys],
    registeredAt: '2026-05-20 09:00'
  },
  {
    id: 'U-1001',
    nickname: '南风',
    studentId: '20261024',
    points: 3200,
    status: '正常',
    role: 'admin',
    permissions: ['review_question', 'review_answer', 'activity_question', 'activity_list'],
    registeredAt: '2026-06-01 09:12'
  },
  {
    id: 'U-1002',
    nickname: '林同学',
    studentId: '20262048',
    points: 1800,
    status: '封禁',
    role: 'user',
    permissions: [],
    registeredAt: '2026-06-10 14:30'
  }
]);

const permissionDrawerVisible = ref(false);
const selectedUserId = ref('');
const selectedPermissionKeys = ref<string[]>([]);

const searchVal = ref('');
const selectedRole = ref<UserRole | null>(null);
const roleOptions: { label: string; value: UserRole }[] = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '超级管理员', value: 'super' }
];

const selectedStatus = ref<string | null>(null);
const statusOptions = [
  { label: '正常', value: '正常' },
  { label: '封禁', value: '封禁' }
];

const filteredUsers = computed(() => {
  return users.value.filter(item => {
    const matchesSearch =
      !searchVal.value ||
      item.nickname.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesRole = !selectedRole.value || item.role === selectedRole.value;
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value;
    return matchesSearch && matchesRole && matchesStatus;
  });
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  }
});

watch([searchVal, selectedRole, selectedStatus], () => {
  pagination.page = 1;
});

const staticSuperRole = import.meta.env.VITE_STATIC_SUPER_ROLE;
const isSuperAdmin = computed(() => authStore.userInfo.roles.includes(staticSuperRole));
const selectedUser = computed(() => users.value.find(item => item.id === selectedUserId.value));

function getRoleLabel(role: UserRole) {
  const roleMap: Record<UserRole, string> = {
    super: '超级管理员',
    admin: '管理员',
    user: '普通用户'
  };

  return roleMap[role];
}

function getRoleTagType(role: UserRole) {
  const typeMap = {
    super: 'error',
    admin: 'warning',
    user: 'default'
  } as const;

  return typeMap[role];
}

function setAdmin(row: Row, checked: boolean) {
  if (!isSuperAdmin.value || row.role === 'super') return;

  row.role = checked ? 'admin' : 'user';
  row.permissions = checked ? ['review_question'] : [];

  window.$message?.success(checked ? '已任命为管理员' : '已取消管理员身份');
}

function openPermissionDrawer(row: Row) {
  selectedUserId.value = row.id;
  selectedPermissionKeys.value = [...row.permissions];
  permissionDrawerVisible.value = true;
}

function savePermissions() {
  if (!isSuperAdmin.value || !selectedUser.value || selectedUser.value.role !== 'admin') return;

  selectedUser.value.permissions = [...selectedPermissionKeys.value];
  permissionDrawerVisible.value = false;
  window.$message?.success('管理员权限已更新');
}

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '姓名', key: 'nickname' },
    { title: '学号', key: 'studentId' },
    {
      title: '身份',
      key: 'role',
      width: 120,
      render: row => h(NTag, { type: getRoleTagType(row.role) }, { default: () => getRoleLabel(row.role) })
    },
    {
      title: '管理员',
      key: 'isAdmin',
      width: 80,
      render: row =>
        h(NSwitch, {
          value: row.role !== 'user',
          disabled: !isSuperAdmin.value || row.role === 'super',
          onUpdateValue: (checked: boolean) => setAdmin(row, checked)
        })
    },
    { title: '状态', key: 'status', width: 76 },
    { title: '注册时间', key: 'registeredAt' },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      resizable: false,
      render: row =>
        h(
          NSpace,
          { size: 8 },
          {
            default: () => [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  secondary: true,
                  disabled: !isSuperAdmin.value || row.role !== 'admin',
                  onClick: () => openPermissionDrawer(row)
                },
                { default: () => `权限 (${row.permissions.length}/${allPermissionKeys.length})` }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  secondary: true,
                  onClick: () => viewUser(row)
                },
                { default: () => '详情' }
              )
            ]
          }
        )
    }
  ],
  users.value
);
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div>
        <div class="flex items-baseline gap-16px">
          <h2 class="m-0 text-20px font-semibold">用户与管理员</h2>
          <p class="text-13px text-#777">超级管理员可任命用户为管理员，并配置管理员可管理的功能范围。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索姓名 / 学号" clearable />
            <NSelect
              v-model:value="selectedRole"
              :options="roleOptions"
              placeholder="身份类型"
              clearable
              class="w-140px"
            />
            <NSelect
              v-model:value="selectedStatus"
              :options="statusOptions"
              placeholder="用户状态"
              clearable
              class="w-140px"
            />
          </NSpace>
        </div>
      </div>
    </NCard>

    <NCard v-if="!isSuperAdmin" :bordered="false" class="card-wrapper">
      <NAlert type="warning" title="权限受限">
        当前账号不是超级管理员，只能查看用户和管理员状态，不能任命管理员或修改权限。
      </NAlert>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        class="resizable-data-table"
        :style="{ '--table-scroll-x': tableScrollX + 'px' }"
        :columns="columns"
        :data="filteredUsers"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        :on-unstable-column-resize="handleColumnResize"
        table-layout="fixed"
        :row-key="row => row.id"
      />
    </NCard>

    <NDrawer v-model:show="permissionDrawerVisible" :width="520" placement="right">
      <NDrawerContent :title="selectedUser ? `权限配置 - ${selectedUser.nickname}` : '权限配置'">
        <NSpace vertical :size="16">
          <NAlert type="info" :show-icon="false">
            管理员身份由超级管理员授予。权限按二级菜单配置，保存后后端应同步刷新该管理员的角色菜单和操作权限。
          </NAlert>

          <NDescriptions v-if="selectedUser" :column="1" bordered label-placement="left">
            <NDescriptionsItem label="姓名">{{ selectedUser.nickname }}</NDescriptionsItem>
            <NDescriptionsItem label="身份">{{ getRoleLabel(selectedUser.role) }}</NDescriptionsItem>
            <NDescriptionsItem label="学号">{{ selectedUser.studentId }}</NDescriptionsItem>
          </NDescriptions>

          <NCheckboxGroup
            v-model:value="selectedPermissionKeys"
            :disabled="!isSuperAdmin || selectedUser?.role !== 'admin'"
          >
            <div class="grid grid-cols-1 gap-14px">
              <section
                v-for="group in permissionGroups"
                :key="group.key"
                class="rounded-6px border border-#eee border-solid p-12px"
              >
                <div class="mb-10px text-14px font-semibold">{{ group.label }}</div>
                <div class="grid grid-cols-1 gap-10px">
                  <label
                    v-for="item in group.options"
                    :key="item.key"
                    class="flex cursor-pointer items-start gap-10px rounded-6px bg-#fafafa p-10px"
                  >
                    <NCheckbox :value="item.key" />
                    <span class="min-w-0">
                      <span class="block text-14px font-medium">{{ item.label }}</span>
                      <span class="mt-4px block text-12px text-#888">{{ item.description }}</span>
                    </span>
                  </label>
                </div>
              </section>
            </div>
          </NCheckboxGroup>
        </NSpace>

        <template #footer>
          <NSpace justify="end">
            <NButton @click="permissionDrawerVisible = false">取消</NButton>
            <NButton
              type="primary"
              :disabled="!isSuperAdmin || selectedUser?.role !== 'admin'"
              @click="savePermissions"
            >
              保存
            </NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </NSpace>
</template>
