import { http } from 'msw';
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

    let filtered = mockDb.feedbacks;
    if (status) filtered = filtered.filter(item => item.status === status);
    if (type !== undefined) filtered = filtered.filter(item => item.type === type);
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      ...item,
      user: mockDb.findUser(item.user_id)
    }));
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
      user: feedback.user || mockDb.findUser(feedback.user_id)
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
