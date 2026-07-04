import { request } from '../request';
import type { PageParams, PageResult } from './types';

export interface OfficialQuestionItem {
  id: string;
  title: string;
  locationText: string;
  activityName: string;
  status: 'draft' | 'published' | 'closed';
  updatedAt: string;
}

export interface OfficialQuestionPayload {
  title: string;
  description: string;
  activityId: string;
  latitude: number;
  longitude: number;
  coverUrl: string;
}

export function fetchOfficialQuestions(params: PageParams) {
  return request<PageResult<OfficialQuestionItem>>({
    url: '/admin/official/questions',
    params
  });
}

export function saveOfficialQuestion(data: OfficialQuestionPayload & { id?: string }) {
  return request<void>({
    url: data.id ? `/admin/official/questions/${data.id}` : '/admin/official/questions',
    method: data.id ? 'put' : 'post',
    data
  });
}

export function publishOfficialQuestion(id: string) {
  return request<void>({
    url: `/admin/official/questions/${id}/publish`,
    method: 'post'
  });
}
