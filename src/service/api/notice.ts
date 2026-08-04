import type { AdminAnnouncement, AdminAnnouncementListItem } from '../contract/types';
import { request } from '../request';
import { appendFormValue } from './types';
import type { OperationResult, PageParams, PageResult } from './types';

// ──────────────────────────────────────────
// 管理端通知类型（无用户已读态，有 read_count）
// ──────────────────────────────────────────

export type { AdminAnnouncementListItem };
export type AdminAnnouncementDetail = AdminAnnouncement;

export interface AnnouncementFormPayload {
  title?: string;
  content?: string;
  image_file?: File;
  related_type?: 'activity';
  related_id?: number;
  remove_image?: boolean;
  remove_relation?: boolean;
}

function createAnnouncementFormData(data: Partial<AnnouncementFormPayload>) {
  const formData = new FormData();
  if (data.title !== undefined) appendFormValue(formData, 'title', data.title);
  if (data.content !== undefined) appendFormValue(formData, 'content', data.content);
  appendFormValue(formData, 'image_file', data.image_file);
  if (data.related_type) appendFormValue(formData, 'related_type', data.related_type);
  if (data.related_id) appendFormValue(formData, 'related_id', data.related_id);
  if (data.remove_image) appendFormValue(formData, 'remove_image', 'true');
  if (data.remove_relation) appendFormValue(formData, 'remove_relation', 'true');
  return formData;
}

/** 管理端：通知列表（含 read_count，无用户已读态） */
export function fetchAdminAnnouncementList(params: PageParams & { keyword?: string }) {
  return request<PageResult<AdminAnnouncementListItem>>({
    url: '/admin/announcements',
    params
  });
}

/** 管理端：通知详情（含 read_count，读取不标记已读） */
export function fetchAdminAnnouncementDetail(id: number) {
  return request<AdminAnnouncementDetail>({ url: `/admin/announcements/${id}` });
}

/** 管理端：发布通知 */
export function createAnnouncement(data: AnnouncementFormPayload) {
  return request<OperationResult>({
    url: '/admin/announcements',
    method: 'post',
    data: createAnnouncementFormData(data)
  });
}

/** 管理端：更新通知 */
export function updateAnnouncement(id: number, data: Partial<AnnouncementFormPayload>) {
  return request<OperationResult>({
    url: `/admin/announcements/${id}`,
    method: 'put',
    data: createAnnouncementFormData(data)
  });
}

/** 管理端：删除通知 */
export function deleteAnnouncement(id: number) {
  return request<OperationResult>({ url: `/admin/announcements/${id}`, method: 'delete' });
}
