import { request } from '../request';
import type { OperationResult, PageParams, PageResult, UserBrief } from './types';

export type FeedbackType = 1 | 2 | 3 | 4;
export type FeedbackStatus = 'pending' | 'resolved';

export interface FeedbackListItem {
  id: number;
  user: UserBrief;
  title: string;
  type: FeedbackType;
  status: FeedbackStatus;
  created_at: string;
}

export interface FeedbackMedia {
  id: number;
  url: string;
  media_type: number;
}

export interface FeedbackDetail {
  id: number;
  user_id?: number;
  user: UserBrief;
  title: string;
  content: string;
  type: FeedbackType;
  phone?: string;
  status: FeedbackStatus;
  medias: FeedbackMedia[];
  created_at: string;
}

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
