<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { NAlert, NAutoComplete, NButton, NInputNumber, NSpin } from 'naive-ui';
import { isAmapConfigured, loadAmap } from '@/utils/amap';
import { renderCoordsInline } from '@/utils/table-columns';

/**
 * 高德地图选点组件。
 *
 * 编辑态支持四种定位方式：地址搜索、地图点击、标记拖拽、浏览器自动定位；
 * 任一方式落点后都会逆地理编码回显地址。坐标系 GCJ-02，与后端 `coord_type: 'gcj02'` 一致。
 *
 * 建图时机由内部 ResizeObserver 决定 —— 放在弹窗 / 标签页里时容器初始为 0×0，
 * 此时建图只会得到一张空白地图，所以不能在 onMounted 直接初始化；父级无需任何配合。
 *
 * 未配置 VITE_AMAP_KEY 时自动降级：编辑态为手填经纬度，只读态为坐标文本 + 高德外链。
 */
const {
  height = 320,
  readonly = false,
  markerName = '标记位置'
} = defineProps<{
  height?: number;
  /** 只读模式：仅展示位置，隐藏搜索 / 定位 / 手填输入，标记不可拖拽、点击地图不改点 */
  readonly?: boolean;
  /** 降级为高德外链时的标记名称 */
  markerName?: string;
}>();

const longitude = defineModel<number | null>('longitude', { default: null });
const latitude = defineModel<number | null>('latitude', { default: null });
/** 逆地理编码得到的地址，供表单回显；组件只写不读 */
const address = defineModel<string>('address', { default: '' });

const mapContainer = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const loadFailed = ref('');
const locating = ref(false);
const searchKeyword = ref('');
const searchOptions = ref<{ label: string; value: string; lng: number; lat: number }[]>([]);

// 地图实例不能用 ref —— Vue 的深层 Proxy 会破坏高德内部状态
const AMapRef = shallowRef<any>(null);
const mapRef = shallowRef<any>(null);
const markerRef = shallowRef<any>(null);
const geocoderRef = shallowRef<any>(null);
const autoCompleteRef = shallowRef<any>(null);

let resizeObserver: ResizeObserver | null = null;

/** 大学主校区中心点 GCJ-02 坐标 */
const DEFAULT_CENTER: [number, number] = [108.98374, 34.24623];

function currentCenter(): [number, number] {
  return longitude.value != null && latitude.value != null ? [longitude.value, latitude.value] : DEFAULT_CENTER;
}

/** 逆地理编码：经纬度 → 结构化地址 */
function reverseGeocode(lng: number, lat: number) {
  if (!geocoderRef.value) return;
  geocoderRef.value.getAddress([lng, lat], (status: string, result: any) => {
    address.value = status === 'complete' && result.regeocode ? result.regeocode.formattedAddress : '';
  });
}

/** 统一的落点入口：更新 model、移动标记、回填地址 */
function applyPoint(lng: number, lat: number, options?: { pan?: boolean }) {
  const nextLng = Number(lng.toFixed(6));
  const nextLat = Number(lat.toFixed(6));
  longitude.value = nextLng;
  latitude.value = nextLat;

  markerRef.value?.setPosition([nextLng, nextLat]);
  if (options?.pan) mapRef.value?.setCenter([nextLng, nextLat]);

  reverseGeocode(nextLng, nextLat);
}

async function createMap() {
  const container = mapContainer.value;
  if (!container || mapRef.value || loading.value) return;

  loading.value = true;
  loadFailed.value = '';
  try {
    const AMap = await loadAmap();
    AMapRef.value = AMap;

    // await 期间组件可能已卸载
    if (!mapContainer.value) return;

    const map = new AMap.Map(container, { zoom: 16, center: currentCenter() });
    mapRef.value = map;

    const marker = new AMap.Marker({
      position: currentCenter(),
      draggable: !readonly,
      cursor: readonly ? 'default' : 'move'
    });
    map.add(marker);
    markerRef.value = marker;

    geocoderRef.value = new AMap.Geocoder();

    if (!readonly) {
      autoCompleteRef.value = new AMap.AutoComplete({ city: '全国' });
      map.on('click', (e: any) => applyPoint(e.lnglat.getLng(), e.lnglat.getLat()));
      marker.on('dragend', (e: any) => applyPoint(e.lnglat.getLng(), e.lnglat.getLat()));
    }

    if (longitude.value != null && latitude.value != null) {
      reverseGeocode(longitude.value, latitude.value);
    }
  } catch (error) {
    loadFailed.value = error instanceof Error ? error.message : '地图加载失败';
  } finally {
    loading.value = false;
  }
}

/** 容器有尺寸后才建图；已建图则只需重算尺寸 */
function handleContainerResize(width: number, boxHeight: number) {
  if (width <= 0 || boxHeight <= 0) return;
  if (mapRef.value) {
    mapRef.value.resize();
    mapRef.value.setCenter(currentCenter());
  } else {
    createMap();
  }
}

// 容器由 v-if 控制显隐，监听 ref 变化挂 observer 比 onMounted 可靠
watch(mapContainer, container => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (!container || !isAmapConfigured) return;

  resizeObserver = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect;
    if (rect) handleContainerResize(rect.width, rect.height);
  });
  resizeObserver.observe(container);
});

/** 浏览器 / IP 自动定位 */
function locateMe() {
  if (!AMapRef.value || locating.value) return;
  locating.value = true;

  const geolocation = new AMapRef.value.Geolocation({ enableHighAccuracy: true, timeout: 10000 });
  geolocation.getCurrentPosition((status: string, result: any) => {
    locating.value = false;
    if (status === 'complete' && result.position) {
      applyPoint(result.position.getLng(), result.position.getLat(), { pan: true });
    } else {
      window.$message?.warning('定位失败，请检查浏览器定位权限后重试');
    }
  });
}

/** 地址搜索输入提示 */
function handleSearch(value: string) {
  searchKeyword.value = value;
  if (!autoCompleteRef.value || !value.trim()) {
    searchOptions.value = [];
    return;
  }

  autoCompleteRef.value.search(value, (status: string, result: any) => {
    searchOptions.value =
      status === 'complete' && result.tips
        ? result.tips
            .filter((tip: any) => tip.location)
            .map((tip: any) => ({
              label: `${tip.name} · ${tip.district || ''}`,
              value: `${tip.name}-${tip.location.lng},${tip.location.lat}`,
              lng: tip.location.lng,
              lat: tip.location.lat
            }))
        : [];
  });
}

function handleSelectSuggestion(value: string) {
  const hit = searchOptions.value.find(item => item.value === value);
  if (!hit) return;
  searchKeyword.value = hit.label;
  applyPoint(hit.lng, hit.lat, { pan: true });
}

// 外部（手填输入框 / 表单回填 / 切换详情行）改动坐标时同步地图
watch([longitude, latitude], ([lng, lat]) => {
  if (lng == null || lat == null || !markerRef.value) return;
  const [curLng, curLat] = markerRef.value.getPosition().toArray();
  if (Math.abs(curLng - lng) < 1e-6 && Math.abs(curLat - lat) < 1e-6) return;
  markerRef.value.setPosition([lng, lat]);
  mapRef.value?.setCenter([lng, lat]);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  mapRef.value?.destroy?.();
  mapRef.value = null;
  markerRef.value = null;
});
</script>

<template>
  <!-- 未配 key：只读态给坐标文本 + 高德外链，编辑态给手填 -->
  <div v-if="!isAmapConfigured" class="w-full flex flex-col gap-10px">
    <component :is="renderCoordsInline({ longitude, latitude }, markerName)" v-if="readonly" />
    <template v-else>
      <NAlert type="warning" :bordered="false">
        未配置
        <code>VITE_AMAP_KEY</code>
        ，地图选点不可用，请直接手动填写经纬度。
      </NAlert>
      <div class="flex items-center gap-10px">
        <span class="text-13px text-#666 shrink-0">经度</span>
        <NInputNumber v-model:value="longitude" :precision="6" :show-button="false" class="flex-1 min-w-0" />
        <span class="text-13px text-#666 shrink-0">纬度</span>
        <NInputNumber v-model:value="latitude" :precision="6" :show-button="false" class="flex-1 min-w-0" />
      </div>
    </template>
  </div>

  <!-- 已配 key：正常地图 -->
  <div v-else class="w-full flex flex-col gap-8px">
    <div v-if="!readonly" class="flex items-center gap-8px">
      <NAutoComplete
        :value="searchKeyword"
        :options="searchOptions"
        placeholder="搜索地点名称或地址"
        clearable
        class="flex-1"
        @update:value="handleSearch"
        @select="handleSelectSuggestion"
      />
      <NButton :loading="locating" @click="locateMe">定位</NButton>
    </div>

    <NAlert v-if="loadFailed" type="error" :bordered="false">
      {{ loadFailed }}
      <NButton text type="primary" class="ml-8px" @click="loadFailed = ''">重试</NButton>
    </NAlert>

    <NSpin v-else :show="loading">
      <div
        ref="mapContainer"
        class="w-full overflow-hidden"
        :class="readonly ? '' : 'border border-gray-200 rounded-8px dark:border-gray-700'"
        :style="{ height: `${height}px` }"
      ></div>
    </NSpin>

    <template v-if="!readonly">
      <p v-if="address" class="m-0 text-12px text-#666 leading-relaxed">{{ address }}</p>
      <div class="flex items-center gap-10px">
        <span class="text-13px text-#666 shrink-0">经度</span>
        <NInputNumber v-model:value="longitude" :precision="6" :show-button="false" class="flex-1 min-w-0" />
        <span class="text-13px text-#666 shrink-0">纬度</span>
        <NInputNumber v-model:value="latitude" :precision="6" :show-button="false" class="flex-1 min-w-0" />
      </div>
    </template>
  </div>
</template>
