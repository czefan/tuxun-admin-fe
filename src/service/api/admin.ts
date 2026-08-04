import type { AdminStats, UserSummary } from '../contract/types';
import { request } from '../request';
import type { OperationResult, PageParams, PageResult, UserStatus } from './types';

export interface FetchUserQueryParams extends PageParams {
  keyword?: string;
  status?: UserStatus;
  level?: number;
}

export type { AdminStats };

export function searchUsers(params: FetchUserQueryParams) {
  return request<PageResult<UserSummary>>({ url: '/admin/users', params });
}

export function updateUserStatus(id: number, status: UserStatus) {
  return request<OperationResult>({ url: `/admin/users/${id}/status`, method: 'put', data: { status } });
}

export function updateAdminLevel(id: number, target_level: 1 | 2) {
  return request<OperationResult>({ url: `/admin/users/${id}/level`, method: 'put', data: { target_level } });
}

export function fetchAdminStats() {
  return request<AdminStats>({ url: '/admin/stats' });
}
