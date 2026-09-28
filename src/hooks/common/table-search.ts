import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { jsonClone } from '@sa/utils';
import { getErrorText } from '@/utils/error';
import { MAX_PAGE_SIZE } from '@/service/api/paginate';
import type { PageResult } from '@/service/api/types';

export interface UseTableSearchOptions<T, P extends Record<string, unknown>> {
  /** 接口查询方法，需要返回包含 list 和 total 的数据结构 */
  fetchApi: (
    params: P & { page: number; page_size: number }
  ) => Promise<{ data?: PageResult<T> | null; error?: unknown }>;
  /** 初始查询参数 */
  initialParams: P;
  /** 默认页码 */
  defaultPage?: number;
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 挂载时是否自动触发一次查询 (默认 true) */
  autoFetch?: boolean;
}

export function useTableSearch<T, P extends Record<string, unknown>>(options: UseTableSearchOptions<T, P>) {
  const { fetchApi, initialParams, defaultPage = 1, defaultPageSize = 10, autoFetch = true } = options;

  const defaults = jsonClone(initialParams);
  const searchParams = ref<P>(jsonClone(defaults));
  const page = ref(Math.max(1, Math.floor(defaultPage) || 1));
  const pageSize = ref(Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(defaultPageSize) || 10)));
  const total = ref(0);
  const rows = shallowRef<T[]>([]);
  const loading = ref(false);
  const loadError = ref(false);
  const errorMessage = ref('');

  let requestSequence = 0;
  let alive = true;

  async function loadData() {
    if (!alive) return;
    const sequence = ++requestSequence;
    loading.value = true;
    loadError.value = false;
    errorMessage.value = '';

    try {
      const response = await fetchApi({
        ...(searchParams.value as P),
        page: page.value,
        page_size: pageSize.value
      });

      if (!alive || sequence !== requestSequence) return;

      if (response?.error) {
        loadError.value = true;
        rows.value = [];
        total.value = 0;
        errorMessage.value = getErrorText(response.error, '列表加载失败，请重试');
      } else {
        const result = response?.data;
        if (!result || !Array.isArray(result.list) || !Number.isSafeInteger(result.total) || result.total < 0) {
          throw new Error('列表返回数据异常，请重试');
        }
        const lastPage = Math.max(1, Math.ceil(result.total / pageSize.value));
        if (page.value > lastPage) {
          page.value = lastPage;
          await loadData();
          return;
        }
        rows.value = result.list;
        total.value = result.total;
      }
    } catch (err: unknown) {
      if (!alive || sequence !== requestSequence) return;
      loadError.value = true;
      rows.value = [];
      total.value = 0;
      errorMessage.value = getErrorText(err, '列表加载失败，请重试');
    } finally {
      if (alive && sequence === requestSequence) {
        loading.value = false;
      }
    }
  }

  function handleSearch() {
    page.value = 1;
    return loadData();
  }

  function handleReset() {
    searchParams.value = jsonClone(defaults);
    page.value = 1;
    return loadData();
  }

  function handlePageChange(val: number) {
    page.value = Math.max(1, Math.floor(val) || 1);
    return loadData();
  }

  function handlePageSizeChange(val: number) {
    pageSize.value = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(val) || 10));
    page.value = 1;
    return loadData();
  }

  const pagination = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    itemCount: total.value,
    pageSizes: [10, 20],
    showSizePicker: true,
    onUpdatePage: handlePageChange,
    onUpdatePageSize: handlePageSizeChange
  }));

  if (autoFetch) {
    onMounted(loadData);
  }

  onBeforeUnmount(() => {
    alive = false;
    requestSequence += 1;
  });

  return {
    searchParams,
    page,
    pageSize,
    total,
    rows,
    loading,
    loadError,
    errorMessage,
    loadData,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    pagination
  };
}
