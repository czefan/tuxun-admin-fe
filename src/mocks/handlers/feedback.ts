import { http } from 'msw';
import type { AdminFeedbackListItem } from '@/service/contract/types';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockNotFound, mockSuccess } from '../response';

export const feedbackHandlers = [
  http.get('/api/admin/feedback', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type') ? Number(url.searchParams.get('type')) : undefined;
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();
    const userKeyword = (url.searchParams.get('user_keyword') || '').toLowerCase().trim();

    let filtered = mockDb.feedbacks;
    if (status) filtered = filtered.filter(item => item.status === status);
    if (type !== undefined) filtered = filtered.filter(item => item.type === type);
    if (keyword) {
      filtered = filtered.filter(
        item =>
          String(item.id).includes(keyword) ||
          item.title.toLowerCase().includes(keyword) ||
          item.content.toLowerCase().includes(keyword)
      );
    }
    if (userKeyword) {
      filtered = filtered.filter(
        item =>
          item.phone.includes(userKeyword) ||
          (item.user &&
            (String(item.user.id).includes(userKeyword) || item.user.nickname.toLowerCase().includes(userKeyword)))
      );
    }

    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list: AdminFeedbackListItem[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  http.get('/api/admin/feedback/:id', ({ params }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const feedback = mockDb.feedbacks.find(item => item.id === id);
    if (!feedback) return mockNotFound('未找到反馈详情');
    return mockSuccess({
      ...feedback,
      media_file: feedback.medias && feedback.medias.length > 0 ? feedback.medias[0] : null
    });
  }),

  http.put('/api/admin/feedback/:id', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { status: 'resolved' };
    const feedback = mockDb.feedbacks.find(item => item.id === id);
    if (!feedback) return mockNotFound('未找到反馈记录');

    feedback.status = body.status;
    return mockSuccess({ id: feedback.id, status: feedback.status }, '反馈已标记为已解决');
  })
];
