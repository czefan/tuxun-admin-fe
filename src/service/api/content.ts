import { request } from '../request';
import type { OperationResult } from './types';

export type ContentKey = 'popup' | 'score_rules' | 'help';

export interface ContentBlock {
  key: ContentKey;
  content: string;
  related_id?: number;
  version: number;
  updated_at: string | null;
}

export interface UpdateContentPayload {
  content: string;
  related_id?: number;
}

export function fetchContentBlock(key: ContentKey) {
  return request<ContentBlock>({ url: `/contents/${key}` });
}

export function updateContentBlock(key: ContentKey, data: UpdateContentPayload) {
  return request<OperationResult & { key: ContentKey; version: number }>({
    url: `/admin/contents/${key}`,
    method: 'put',
    data
  });
}
