import { http } from 'msw';
import type { ActivityCard } from '@/service/contract/types';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockNotFound, mockSuccess } from '../response';

export const activityHandlers = [
  http.get('/api/activity', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const keyword = (url.searchParams.get('keyword') || '').trim().slice(0, 50);

    let filtered = mockDb.activities;
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.title.includes(keyword) || item.description.includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list: ActivityCard[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  http.get('/api/admin/activity', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').trim().slice(0, 50);

    const now = Date.now();

    let filtered = mockDb.activities;
    if (status) {
      filtered = filtered.filter(item => {
        if (status === 'not_started') return now < new Date(item.start_time).getTime();
        if (status === 'active')
          return new Date(item.start_time).getTime() <= now && now < new Date(item.end_time).getTime();
        if (status === 'ended') return now >= new Date(item.end_time).getTime();
        return true;
      });
    }

    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.title.includes(keyword) || item.description.includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list: ActivityCard[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  http.post('/api/admin/activity', async ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const formData = await request.formData();
    const title = String(formData.get('title') || '');
    const description = String(formData.get('description') || '');
    const startTime = String(formData.get('start_time') || '');
    const endTime = String(formData.get('end_time') || '');

    const newActivity = {
      id: mockDb.activities.length + 1,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      cover_image: {
        thumb_url: `/api/photos/${mockDb.activities.length + 1}/image`,
        origin_url: `/api/photos/${mockDb.activities.length + 1}/image`,
        width: 800,
        height: 600
      },
      photo_count: 0,
      created_at: new Date().toISOString()
    };
    mockDb.activities.unshift(newActivity);
    return mockSuccess({ id: newActivity.id, status: 'success' }, '活动创建成功', 201);
  }),

  http.put('/api/admin/activity/:id', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const activity = mockDb.activities.find(item => item.id === id);
    if (!activity) return mockNotFound('未找到要更新的活动');

    const formData = await request.formData();
    if (formData.has('title')) activity.title = String(formData.get('title'));
    if (formData.has('description')) activity.description = String(formData.get('description'));
    if (formData.has('start_time')) activity.start_time = String(formData.get('start_time'));
    if (formData.has('end_time')) activity.end_time = String(formData.get('end_time'));

    return mockSuccess({ id: activity.id, status: 'success' }, '活动已更新');
  })
];
