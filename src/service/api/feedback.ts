import type { AdminFeedbackListItem, FeedbackDetail, FeedbackMedia } from '../contract/types';
import { request } from '../request';
import type { OperationResult, PageParams, PageResult } from './types';

export type FeedbackType = 1 | 2 | 3 | 4;
export type FeedbackStatus = 'pending' | 'resolved';

export type FeedbackListItem = AdminFeedbackListItem;
export type { FeedbackDetail, FeedbackMedia };

export function fetchFeedbackList(
  params: PageParams & { type?: FeedbackType; status?: FeedbackStatus; keyword?: string; user_keyword?: string }
) {
  return request<PageResult<FeedbackListItem>>({ url: '/admin/feedback', params });
}

export function fetchFeedbackDetail(id: number) {
  return request<FeedbackDetail>({ url: `/admin/feedback/${id}` });
}

export function updateFeedbackStatus(id: number, status: FeedbackStatus) {
  return request<OperationResult>({ url: `/admin/feedback/${id}`, method: 'put', data: { status } });
}
