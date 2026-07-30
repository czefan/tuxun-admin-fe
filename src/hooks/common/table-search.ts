import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export interface UseTableSearchOptions<T, P extends Record<string, any>> {
  /** 接口查询方法，需要返回包含 list 和 total 的数据结构 */
  fetchApi: (
    params: P & { page: number; page_size: number }
  ) => Promise<{ data?: { list?: T[]; total?: number } | null; error?: any } | any>;
  /** 初始查询参数 */
  initialParams: P;
  /** 默认页码 */
  defaultPage?: number;
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 挂载时是否自动触发一次查询 (默认 true) */
  autoFetch?: boolean;
}

export function useTableSearch<T, P extends Record<string, any>>(options: UseTableSearchOptions<T, P>) {
  const { fetchApi, initialParams, defaultPage = 1, defaultPageSize = 10, autoFetch = true } = options;

  const searchParams = ref<P>({ ...initialParams });
  const page = ref(defaultPage);
  const pageSize = ref(defaultPageSize);
  const total = ref(0);
  const rows = ref<T[]>([]);
  const loading = ref(false);
  const loadError = ref(false);
  const errorMessage = ref('');

  let requestSequence = 0;
  let alive = true;

  async function loadData() {
    const sequence = ++requestSequence;
    loading.value = true;
    loadError.value = false;
    errorMessage.value = '';

    try {
      const response = await fetchApi({
        ...searchParams.value,
        page: page.value,
        page_size: pageSize.value
      });

      if (!alive || sequence !== requestSequence) return;

      if (response?.error) {
        loadError.value = true;
        rows.value = [];
        total.value = 0;
        const errObj = response.error;
        const msg = errObj?.message || errObj?.msg || errObj?.response?.data?.message || '';
        const code = errObj?.code || errObj?.status || errObj?.response?.status;
        if (code === 403 || code === '403' || msg.includes('权限') || msg.includes('无权')) {
          errorMessage.value = msg || '权限不足，无法查看此列表';
        } else {
          errorMessage.value = msg;
        }
      } else if (response?.data) {
        rows.value = response.data.list || [];
        total.value = response.data.total || 0;
      }
    } catch (err: any) {
      if (!alive || sequence !== requestSequence) return;
      loadError.value = true;
      rows.value = [];
      total.value = 0;
      errorMessage.value = err?.message || '';
    } finally {
      if (alive && sequence === requestSequence) {
        loading.value = false;
      }
    }
  }

  function handleSearch() {
    page.value = 1;
    loadData();
  }

  function handleReset() {
    searchParams.value = { ...initialParams };
    page.value = 1;
    loadData();
  }

  function handlePageChange(val: number) {
    page.value = val;
    loadData();
  }

  function handlePageSizeChange(val: number) {
    pageSize.value = val;
    page.value = 1;
    loadData();
  }

  const pagination = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    itemCount: total.value,
    pageSizes: [10, 20],
    showSizePicker: true,
    onChange: handlePageChange,
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
