import type { AdminExchangeRecord, GoodItem } from '../contract/types';
import { request } from '../request';
import { appendFormValue } from './types';
import type { GoodBrief, OperationResult, PageParams, PageResult } from './types';

export type GoodStatus = 'in_store' | 'out_store';
export type ExchangeStatus = 'pending' | 'verified' | 'cancelled';

export type GoodListItem = GoodItem;
export type GoodDetail = GoodListItem;

export interface GoodFormPayload {
  name?: string;
  description?: string;
  /** 兑换所需积分 */
  score_price?: number;
  stock?: number;
  image_file?: File;
  status?: GoodStatus;
}

export type { GoodBrief };

export type ExchangeItem = AdminExchangeRecord;

function createGoodFormData(data: Partial<GoodFormPayload>) {
  const formData = new FormData();
  if (data.name !== undefined) appendFormValue(formData, 'name', data.name);
  if (data.description !== undefined) appendFormValue(formData, 'description', data.description);
  if (data.score_price !== undefined) appendFormValue(formData, 'score_price', data.score_price);
  if (data.stock !== undefined) appendFormValue(formData, 'stock', data.stock);
  if (data.image_file) appendFormValue(formData, 'image_file', data.image_file);
  if (data.status !== undefined) appendFormValue(formData, 'status', data.status);
  return formData;
}

export function fetchGoods(params: PageParams & { status?: GoodStatus; keyword?: string }) {
  return request<PageResult<GoodListItem>>({ url: '/admin/goods', params });
}

export function createGood(data: GoodFormPayload) {
  return request<OperationResult>({ url: '/admin/goods', method: 'post', data: createGoodFormData(data) });
}

export function updateGood(id: number, data: GoodFormPayload) {
  return request<OperationResult>({ url: `/admin/goods/${id}`, method: 'put', data: createGoodFormData(data) });
}

export function deleteGood(id: number) {
  return request<OperationResult>({ url: `/admin/goods/${id}`, method: 'delete' });
}

export function updateGoodStatus(id: number, status: GoodStatus) {
  return updateGood(id, { status });
}

export function updateGoodStock(id: number, stock: number) {
  return updateGood(id, { stock });
}

export function fetchExchanges(
  params: PageParams & {
    status?: ExchangeStatus;
    /** 按兑换记录 ID 搜索 */
    keyword?: string;
    user_keyword?: string;
    good_keyword?: string;
    verify_code?: string;
  }
) {
  return request<PageResult<ExchangeItem>>({ url: '/admin/exchange', params });
}

export function verifyExchange(exchangeId: number, action: 'verify' | 'cancel') {
  return request<OperationResult>({ url: `/admin/exchange/${exchangeId}/verify`, method: 'put', data: { action } });
}
