import { describe, expect, it, vi } from 'vitest';
import { create } from 'axios';
import { createAxiosConfig } from '../../packages/axios/src/options';
import { createRequest } from '../../packages/axios/src';
import { fetchAllPages } from '@/service/api/paginate';
import { useOperatingKeys } from '@/hooks/common/operating-keys';

describe('请求与分页契约', () => {
  it('数组编码为重复参数，保留 false/0 并忽略空筛选', () => {
    const url = create(createAxiosConfig()).getUri({
      url: 'https://example.test/api',
      params: { activity_ids: [101, 102], solved: false, zero: 0, empty: null }
    });
    const params = new URL(url).searchParams;
    expect(params.getAll('activity_ids')).toEqual(['101', '102']);
    expect(params.get('solved')).toBe('false');
    expect(params.get('zero')).toBe('0');
    expect(params.has('empty')).toBe(false);
  });
  it('普通请求实例保留默认状态', () => {
    const request = createRequest({}, { defaultState: { retries: 1 } });
    expect(request.state.retries).toBe(1);
  });
  it('逐页读取完整列表，每页不超过 20 条', async () => {
    const fetcher = vi.fn(async ({ page }: { page: number }) => ({
      data: { list: page === 1 ? Array.from({ length: 20 }, (_, i) => i) : [20], total: 21 }
    }));
    expect(await fetchAllPages(fetcher)).toEqual({ list: Array.from({ length: 21 }, (_, i) => i), truncated: false });
    expect(fetcher).toHaveBeenLastCalledWith({ page: 2, page_size: 20 });
  });
  it('中途失败不会悄悄返回不完整的候选项', async () => {
    const error = new Error('offline');
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ data: { list: Array(20).fill(1), total: 21 } })
      .mockResolvedValueOnce({ error });
    await expect(fetchAllPages(fetcher)).rejects.toBe(error);
  });
  it('总量超限只请求十页并明确标记截断', async () => {
    const fetcher = vi.fn(async () => ({ data: { list: Array(20).fill(1), total: 10000 } }));
    expect((await fetchAllPages(fetcher)).truncated).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(10);
  });
  it('行操作传回 false，并阻止并发提交', async () => {
    const operations = useOperatingKeys<number>();
    let finish!: (value: boolean) => void;
    const first = operations.run(
      1,
      () =>
        new Promise<boolean>(resolve => {
          finish = resolve;
        })
    );
    const duplicate = vi.fn();
    expect(await operations.run(1, duplicate)).toBe(false);
    expect(duplicate).not.toHaveBeenCalled();
    finish(false);
    expect(await first).toBe(false);
    expect(operations.isOperating(1)).toBe(false);
  });
});
