<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { NAvatar, NImage } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { confirmAction } from '@/utils/confirm';
import { $t } from '@/locales';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

function logout() {
  confirmAction({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    tone: 'info',
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onConfirm: () => authStore.logout()
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else {
    // If your other options are jumps from other routes, they will be directly supported here
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon class="px-12px">
        <NImage
          v-if="authStore.userInfo.avatar"
          :src="authStore.userInfo.avatar"
          width="28"
          height="28"
          object-fit="cover"
          class="rounded-full overflow-hidden mr-8px border border-gray-200 dark:border-gray-700"
          :preview-disabled="true"
        />
        <NAvatar v-else round :size="28" class="mr-8px bg-primary/10 text-primary font-medium">
          {{ (authStore.userInfo.nickname || authStore.userInfo.username || '管').slice(0, 1) }}
        </NAvatar>
        <span class="text-15px font-medium text-gray-900 dark:text-gray-100">
          {{ authStore.userInfo.nickname || authStore.userInfo.username }}
        </span>
      </ButtonIcon>
    </div>
  </NDropdown>
</template>

<style scoped></style>
