import type { PageParams, PageResult } from './types';

/** api.md 约定：page_size 上限 20，越界后端按 code=3 参数错误拒绝 */
export const MAX_PAGE_SIZE = 20;

/** 兜底页数，避免后端 total 异常时把请求打爆；对应最多 200 条 */
const MAX_PAGES = 10;

type ListFetcher<T> = (params: PageParams) => Promise<{ data?: PageResult<T> | null; error?: unknown }>;

/**
 * 逐页取完一个列表接口。
 *
 * 下拉选择器需要「全部」数据，但分页上限只有 20，
 * 直接传 page_size=100 会被后端按参数错误拒绝，只能翻页累加。
 *
 * @returns 取到的条目；`truncated` 表示是否因触顶 MAX_PAGES 而未取完
 */
export async function fetchAllPages<T>(fetcher: ListFetcher<T>): Promise<{ list: T[]; truncated: boolean }> {
  const list: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // 逐页串行：下一页要不要发取决于上一页的结果
    // eslint-disable-next-line no-await-in-loop
    const response = await fetcher({ page, page_size: MAX_PAGE_SIZE });
    if (response.error) throw response.error;

    if (!response.data || !Array.isArray(response.data.list)) {
      throw new Error('列表返回数据异常');
    }

    const pageList = response.data.list;
    list.push(...pageList);

    const total = response.data.total;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('列表总数异常');
    if (pageList.length < MAX_PAGE_SIZE || list.length >= total) {
      return { list, truncated: false };
    }
  }

  return { list, truncated: true };
}
