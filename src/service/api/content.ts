import { request } from '../request';
import type { PageParams, PageResult } from './types';

export interface CommentItem {
  id: string;
  questionTitle: string;
  userName: string;
  content: string;
  riskLevel: 'normal' | 'suspicious' | 'blocked';
  createdAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  target: 'all' | 'users';
  sentAt?: string;
  status: 'draft' | 'sent';
}

export interface NoticePayload {
  title: string;
  content: string;
  target: 'all' | 'users';
  userIds?: string[];
}

export function fetchComments(params: PageParams) {
  return request<PageResult<CommentItem>>({
    url: '/admin/comments',
    params
  });
}

export function deleteComment(id: string) {
  return request<void>({
    url: `/admin/comments/${id}`,
    method: 'delete'
  });
}

export function fetchNotices(params: PageParams) {
  return request<PageResult<NoticeItem>>({
    url: '/admin/notices',
    params
  });
}

export function createNotice(data: NoticePayload) {
  return request<void>({
    url: '/admin/notices',
    method: 'post',
    data
  });
}

export function sendNotice(id: string) {
  return request<void>({
    url: `/admin/notices/${id}/send`,
    method: 'post'
  });
}
