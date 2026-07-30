import { request } from '../request';
import { appendFormValue } from './types';
import type { GoodBrief, OperationResult, PageParams, PageResult, UserBrief } from './types';

export type GoodStatus = 'in_store' | 'out_store';
export type ExchangeStatus = 'pending' | 'verified' | 'cancelled';

export interface GoodListItem {
  id: number;
  name: string;
  description: string;
  thumb_url: string;
  image_url: string;
  /** 兑换所需积分 */
  score_price: number;
  stock: number;
  status: GoodStatus;
  created_at: string;
}

export type GoodDetail = GoodListItem;

export interface GoodFormPayload {
  name?: string;
  description?: string;
  /** 兑换所需积分 */
  score_price?: number;
  stock?: number;
  image?: File;
  status?: GoodStatus;
}

export type { GoodBrief };

export interface ExchangeItem {
  id: number;
  user: UserBrief;
  good: GoodBrief;
  quantity: number;
  score_cost: number;
  status: ExchangeStatus;
  exchange_at: string | null;
  created_at: string;
}

function createGoodFormData(data: Partial<GoodFormPayload>) {
  const formData = new FormData();
  if (data.name !== undefined) appendFormValue(formData, 'name', data.name);
  if (data.description !== undefined) appendFormValue(formData, 'description', data.description);
  if (data.score_price !== undefined) appendFormValue(formData, 'score_price', data.score_price);
  if (data.stock !== undefined) appendFormValue(formData, 'stock', data.stock);
  if (data.image) appendFormValue(formData, 'image', data.image);
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
  }
) {
  return request<PageResult<ExchangeItem>>({ url: '/admin/exchange', params });
}

export function verifyExchange(exchangeId: number, action: 'verify' | 'cancel') {
  return request<OperationResult>({ url: `/admin/exchange/${exchangeId}/verify`, method: 'put', data: { action } });
}
