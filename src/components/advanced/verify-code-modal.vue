<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  NAvatar,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NImage,
  NModal,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui';
import QrScanner from 'qr-scanner';
import { fetchExchanges, verifyExchange } from '@/service/api/mall';
import type { ExchangeItem } from '@/service/api/mall';
import { toImageVM } from '@/service/contract/types';
import { formatDateTime } from '@/utils/tuxun';
import { confirmAction } from '@/utils/confirm';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'VerifyCodeModal' });

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: 'update:show', value: boolean): void; (e: 'success'): void }>();

const isDev = import.meta.env.DEV;
const message = useMessage();
const record = ref<ExchangeItem | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const submitting = ref(false);
let qrScanner: QrScanner | null = null;

/** 相机异常友好解析 */
const parseErr = (err: any) =>
  ({
    NotAllowedError: '相机权限已被拒绝，请开启权限',
    NotFoundError: '未检测到可用摄像头设备',
    NotReadableError: '摄像头已被其他应用占用'
  })[err?.name as string] ||
  err?.message ||
  '无法开启摄像头';

/** 开启扫码相机 */
async function startScanner() {
  stopScanner();
  record.value = null;
  await nextTick();
  if (videoRef.value) {
    qrScanner = new QrScanner(videoRef.value, res => res?.data && onScanned(res.data), {
      highlightScanRegion: true,
      highlightCodeOutline: true
    });
    qrScanner.start().catch(err => message.warning(parseErr(err)));
  }
}

/** 销毁实例 */
function stopScanner() {
  qrScanner?.stop();
  qrScanner?.destroy();
  qrScanner = null;
}

/** 识别二维码查单 */
async function onScanned(codeStr: string) {
  const code = codeStr.trim().toUpperCase();
  if (!code || submitting.value) return;

  stopScanner();
  submitting.value = true;
  const res = await fetchExchanges({ page: 1, page_size: 1, verify_code: code });
  submitting.value = false;

  if (res.error) {
    message.error(res.error.message || '查询订单失败');
    startScanner();
    return;
  }

  if (res.data?.list?.length) {
    record.value = res.data.list[0];
  } else {
    message.error(`未查到核销码 [${code}] 对应的订单`);
    startScanner();
  }
}

/** 核销或取消 (二次确认防误触) */
function handleVerify(action: 'verify' | 'cancel') {
  if (!record.value) return;
  const item = record.value;
  const isVerify = action === 'verify';
  const actionText = isVerify ? '核销' : '取消';

  confirmAction({
    title: `确认${actionText}订单`,
    content: isVerify
      ? `确认核销订单 #${item.id}（核销码：${item.verify_code}）？核销后不可撤销。`
      : `确认取消订单 #${item.id}？取消后退还 ${item.score_cost} 积分并恢复库存。`,
    tone: isVerify ? 'warning' : 'error',
    positiveText: `确认${actionText}`,
    onConfirm: async () => {
      submitting.value = true;
      const res = await verifyExchange(item.id, action);
      submitting.value = false;

      if (res.error) {
        message.error(res.error.message || `${actionText}失败`);
        return;
      }

      message.success(`订单 #${item.id} 已${actionText}`);
      emit('success');
      startScanner();
    }
  });
}

watch(
  () => props.show,
  val => (val ? startScanner() : stopScanner())
);
onBeforeUnmount(stopScanner);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="扫码核销"
    class="w-600px max-w-92vw"
    :mask-closable="false"
    @update:show="emit('update:show', $event)"
  >
    <NSpace vertical :size="16">
      <!-- 1. 扫码窗口 (未匹配订单时展示) -->
      <div v-if="!record" class="flex flex-col items-center">
        <div
          class="relative w-full max-w-360px aspect-square rounded-12px bg-black overflow-hidden border border-gray-200"
        >
          <video ref="videoRef" class="w-full h-full object-cover" />
        </div>
        <p class="text-13px text-gray-500 my-12px">请将兑换二维码放置于对焦点内</p>
        <NButton
          v-if="isDev"
          type="primary"
          secondary
          block
          @click="onScanned(['EXCH8881', 'EXCH8882', 'EXCH8883'][Math.floor(Math.random() * 3)])"
        >
          <template #icon><SvgIcon icon="ri:qr-scan-2-line" /></template>
          模拟抓拍扫码 (仅开发调试)
        </NButton>
      </div>

      <!-- 2. 订单确认卡片 (匹配成功后展示) -->
      <div v-else class="space-y-4">
        <NCard title="兑换订单确认" size="small">
          <NDescriptions :column="2" bordered label-placement="left">
            <NDescriptionsItem label="ID">#{{ record.id }}</NDescriptionsItem>
            <NDescriptionsItem label="核销码">
              <span class="font-mono font-bold text-primary">{{ record.verify_code }}</span>
            </NDescriptionsItem>
            <NDescriptionsItem label="用户">
              <div class="flex items-center gap-6px">
                <NAvatar round :size="20" :src="record.user?.avatar" fallback-src="/favicon.svg" />
                <span>{{ record.user?.nickname }} (ID: {{ record.user?.id }})</span>
              </div>
            </NDescriptionsItem>
            <NDescriptionsItem label="状态">
              <div class="flex items-center h-full">
                <NTag v-if="record.status === 'pending'" type="warning" size="small">待核销</NTag>
                <NTag v-else-if="record.status === 'verified'" type="success" size="small">已核销</NTag>
                <NTag v-else type="error" size="small">已取消</NTag>
              </div>
            </NDescriptionsItem>
            <NDescriptionsItem label="奖品" :span="2">
              <div class="flex items-center gap-8px">
                <NImage
                  v-if="record.good?.image"
                  :src="toImageVM(record.good.image, 'thumb').url"
                  :preview-src="toImageVM(record.good.image, 'origin').url"
                  width="40"
                  height="40"
                  object-fit="cover"
                  :img-props="{ class: 'rounded-6px' }"
                  class="rounded-6px object-cover flex-shrink-0 overflow-hidden"
                />
                <div>
                  <div class="font-medium">#{{ record.good?.id }} {{ record.good?.name }}</div>
                  <div class="text-12px text-gray-500">
                    单价: {{ record.good?.score_price }} 积分 | 消耗积分: {{ record.score_cost }} 积分
                  </div>
                </div>
              </div>
            </NDescriptionsItem>
            <NDescriptionsItem label="数量">{{ record.quantity }} 件</NDescriptionsItem>
            <NDescriptionsItem label="创建时间">{{ formatDateTime(record.created_at) }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <div class="flex justify-between items-center pt-1">
          <NButton secondary @click="startScanner">重新扫码</NButton>
          <div class="flex gap-12px">
            <template v-if="record.status === 'pending'">
              <NButton type="error" ghost :loading="submitting" @click="handleVerify('cancel')">取消订单</NButton>
              <NButton type="primary" :loading="submitting" @click="handleVerify('verify')">确认核销</NButton>
            </template>
            <NButton v-else @click="emit('update:show', false)">关闭</NButton>
          </div>
        </div>
      </div>
    </NSpace>
  </NModal>
</template>

<style scoped>
:deep(.n-descriptions-table-content) {
  vertical-align: middle !important;
}
</style>
