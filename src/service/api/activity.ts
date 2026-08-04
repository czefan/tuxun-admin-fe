import type { ActivityCard } from '../contract/types';
import { request } from '../request';
import { appendFormValue } from './types';
import type { OperationResult, PageParams, PageResult } from './types';

export type ActivityListItem = ActivityCard;

export interface ActivityFormPayload {
  title: string;
  cover_file?: File;
  description: string;
  start_time: string;
  end_time: string;
}

function createActivityFormData(data: Partial<ActivityFormPayload>) {
  const formData = new FormData();
  appendFormValue(formData, 'title', data.title);
  appendFormValue(formData, 'cover_file', data.cover_file);
  appendFormValue(formData, 'description', data.description);
  appendFormValue(formData, 'start_time', data.start_time);
  appendFormValue(formData, 'end_time', data.end_time);
  return formData;
}

export function fetchActivityList(params: PageParams & { keyword?: string; status?: 'active' | 'ended' }) {
  return request<PageResult<ActivityCard>>({ url: '/activity', params });
}

export function fetchAdminActivityList(
  params: PageParams & { keyword?: string; status?: 'not_started' | 'active' | 'ended' }
) {
  return request<PageResult<ActivityCard>>({ url: '/admin/activity', params });
}

export function createActivity(data: ActivityFormPayload) {
  return request<OperationResult>({
    url: '/admin/activity',
    method: 'post',
    data: createActivityFormData(data)
  });
}

export function updateActivity(id: number, data: Partial<ActivityFormPayload>) {
  return request<OperationResult>({
    url: `/admin/activity/${id}`,
    method: 'put',
    data: createActivityFormData(data)
  });
}

export interface AdminPhotoPayload {
  activity_id?: number;
  title?: string;
  description?: string;
  image_file?: File;
  longitude?: number;
  latitude?: number;
  coord_type?: string;
}

export type ActivityPhotoPayload = AdminPhotoPayload;

function createAdminPhotoFormData(data: Partial<AdminPhotoPayload>) {
  const formData = new FormData();
  if (data.activity_id !== undefined) appendFormValue(formData, 'activity_id', data.activity_id);
  if (data.title !== undefined) appendFormValue(formData, 'title', data.title);
  if (data.description !== undefined) appendFormValue(formData, 'description', data.description);
  appendFormValue(formData, 'image_file', data.image_file);
  if (data.longitude !== undefined) appendFormValue(formData, 'longitude', data.longitude);
  if (data.latitude !== undefined) appendFormValue(formData, 'latitude', data.latitude);
  if (data.coord_type) appendFormValue(formData, 'coord_type', data.coord_type);
  return formData;
}

export function createAdminPhoto(data: AdminPhotoPayload) {
  return request<OperationResult>({
    url: '/admin/photos',
    method: 'post',
    data: createAdminPhotoFormData(data)
  });
}

export function updateAdminPhoto(id: number, data: Partial<AdminPhotoPayload>) {
  return request<OperationResult>({
    url: `/admin/photos/${id}`,
    method: 'put',
    data: createAdminPhotoFormData(data)
  });
}
