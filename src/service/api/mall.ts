import { request } from '../request';
import type { PageParams, PageResult } from './types';

export interface ProductItem {
  id: string;
  name: string;
  points: number;
  stock: number;
  status: 'on' | 'off';
}

export interface ProductPayload {
  name: string;
  points: number;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface RedemptionItem {
  id: string;
  productName: string;
  userName: string;
  code: string;
  status: 'pending' | 'verified' | 'expired';
  exchangedAt: string;
}

export function fetchProducts(params: PageParams) {
  return request<PageResult<ProductItem>>({
    url: '/admin/mall/products',
    params
  });
}

export function saveProduct(data: ProductPayload & { id?: string }) {
  return request<void>({
    url: data.id ? `/admin/mall/products/${data.id}` : '/admin/mall/products',
    method: data.id ? 'put' : 'post',
    data
  });
}

export function updateProductStatus(id: string, status: ProductItem['status']) {
  return request<void>({
    url: `/admin/mall/products/${id}/status`,
    method: 'put',
    data: { status }
  });
}

export function fetchRedemptions(params: PageParams) {
  return request<PageResult<RedemptionItem>>({
    url: '/admin/mall/redemptions',
    params
  });
}

export function verifyRedemption(code: string) {
  return request<void>({
    url: '/admin/mall/redemptions/verify',
    method: 'post',
    data: { code }
  });
}
