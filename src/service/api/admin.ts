import { request } from '../request';
import type { OperationResult, PageParams, PageResult, UserStatus, UserSummary } from './types';

export interface FetchUserQueryParams extends PageParams {
  keyword?: string;
  status?: UserStatus;
  level?: number;
}

export interface AdminStats {
  /** 全站用户总数（含被封禁账号与 Level 2/3） */
  user_count: number;
  /** 待审核投稿数 */
  pending_photo_count: number;
  /** 待审核作答数 */
  pending_attempt_count: number;
  /** 待审核评论数 */
  pending_comment_count: number;
  /** 待处理反馈数 */
  pending_feedback_count: number;
}

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
