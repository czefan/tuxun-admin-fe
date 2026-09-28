import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useTableSearch } from '@/hooks/common/table-search';
import type { PageResult } from '@/service/api/types';

type Result = { data?: PageResult<number> | null; error?: unknown };
const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));

function setup(fetchApi: (params: { ids: number[]; page: number; page_size: number }) => Promise<Result>) {
  let table!: ReturnType<typeof useTableSearch<number, { ids: number[] }>>;
  const wrapper = mount(
    defineComponent({
      setup() {
        table = useTableSearch({ fetchApi, initialParams: { ids: [] }, autoFetch: false });
        return () => h('div');
      }
    })
  );
  cleanups.push(() => wrapper.unmount());
  return { table, wrapper };
}

describe('列表查询', () => {
  it('只显示最后一次筛选结果，旧请求完成不覆盖数据', async () => {
    const resolvers: ((value: Result) => void)[] = [];
    const { table } = setup(() => new Promise(resolve => resolvers.push(resolve)));
    const first = table.loadData();
    const second = table.loadData();
    resolvers[1]({ data: { list: [2], total: 1 } });
    await second;
    resolvers[0]({ data: { list: [1], total: 1 } });
    await first;
    expect(table.rows.value).toEqual([2]);
    expect(table.loading.value).toBe(false);
  });

  it('删除末页唯一记录后回到有效页并重新加载', async () => {
    const fetchApi = vi.fn(async ({ page }: { page: number }) => ({
      data: { list: page === 3 ? [] : [20], total: 20 }
    }));
    const { table } = setup(fetchApi);
    table.page.value = 3;
    await table.loadData();
    expect(table.page.value).toBe(2);
    expect(table.rows.value).toEqual([20]);
    expect(fetchApi).toHaveBeenCalledTimes(2);
  });

  it('重置恢复独立的数组默认值', async () => {
    const { table } = setup(async () => ({ data: { list: [], total: 0 } }));
    table.searchParams.value.ids.push(101);
    await table.handleReset();
    expect(table.searchParams.value.ids).toEqual([]);
  });

  it('优先显示后端错误且清空上次结果', async () => {
    const { table } = setup(async () => ({
      error: { message: 'Request failed', response: { data: { message: '无权查看' } } }
    }));
    table.rows.value = [1];
    await table.loadData();
    expect(table.errorMessage.value).toBe('无权查看');
    expect(table.rows.value).toEqual([]);
  });

  it('异常空响应不会被当成成功', async () => {
    const { table } = setup(async () => ({ data: null }));
    await table.loadData();
    expect(table.loadError.value).toBe(true);
  });

  it('卸载后不会继续查询', async () => {
    const fetchApi = vi.fn(async () => ({ data: { list: [], total: 0 } }));
    const { table, wrapper } = setup(fetchApi);
    wrapper.unmount();
    await table.loadData();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
