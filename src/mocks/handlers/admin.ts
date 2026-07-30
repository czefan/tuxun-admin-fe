import { http } from 'msw';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockError, mockNotFound, mockSuccess } from '../response';

export const adminHandlers = [
  http.get('/api/admin/stats', () => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const pending_photo_count = mockDb.photos.filter(item => item.status === 'pending').length;
    const pending_attempt_count = mockDb.attempts.filter(item => item.status === 'pending').length;
    const pending_comment_count = mockDb.comments.filter(item => item.status === 'pending').length;
    const pending_feedback_count = mockDb.feedbacks.filter(item => item.status === 'pending').length;
    const user_count = mockDb.users.length;

    return mockSuccess({
      user_count,
      pending_photo_count,
      pending_attempt_count,
      pending_comment_count,
      pending_feedback_count
    });
  }),

  http.get('/api/admin/users', ({ request }) => {
    const authError = checkAdminAuth(3);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const keyword = (url.searchParams.get('keyword') || '').trim().slice(0, 50);
    const netid = (url.searchParams.get('netid') || '').trim();
    const name = (url.searchParams.get('name') || '').trim();
    const nickname = (url.searchParams.get('nickname') || '').trim();
    const status = url.searchParams.get('status');
    const levelStr = url.searchParams.get('level');
    const level = levelStr !== null ? Number(levelStr) : null;

    let filtered = mockDb.users;
    if (keyword) {
      filtered = filtered.filter(
        item => item.nickname.includes(keyword) || item.name.includes(keyword) || item.netid.includes(keyword)
      );
    }
    if (netid) filtered = filtered.filter(item => item.netid === netid);
    if (name) filtered = filtered.filter(item => item.name === name);
    if (nickname) filtered = filtered.filter(item => item.nickname === nickname);
    if (status) filtered = filtered.filter(item => item.status === status);
    if (level !== null && !isNaN(level)) filtered = filtered.filter(item => item.level === level);
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      ...item,
      username: item.username || item.name
    }));
    return mockSuccess({ total: filtered.length, list });
  }),

  http.put('/api/admin/users/:id/status', async ({ params, request }) => {
    const authError = checkAdminAuth(3);
    if (authError) return authError;

    const id = Number(params.id);
    if (mockDb.session?.id === id) {
      return mockError('不能对当前登录账号执行封禁操作');
    }

    const body = (await request.json()) as { status: 'active' | 'banned' };
    const user = mockDb.users.find(item => item.id === id);
    if (!user) return mockNotFound('用户不存在');
    if (user.level >= 3) return mockError('不可封禁超级管理员账号');

    user.status = body.status;
    return mockSuccess({ id: user.id, status: user.status }, body.status === 'banned' ? '账号已被封禁' : '账号已解封');
  }),

  http.put('/api/admin/users/:id/level', async ({ params, request }) => {
    const authError = checkAdminAuth(3);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { target_level: 1 | 2 };
    const user = mockDb.users.find(item => item.id === id);
    if (!user) return mockNotFound('用户不存在');

    user.level = body.target_level;
    if (mockDb.session && mockDb.session.id === user.id) {
      mockDb.session.level = body.target_level;
    }
    return mockSuccess({ id: user.id, status: 'success' }, `用户等级已调整为 Level ${body.target_level}`);
  }),

  http.post('/api/admin/photos', async ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const formData = await request.formData();
    const activityId = Number(formData.get('activity_id') || 101);
    const activity = mockDb.activities.find(item => item.id === activityId);
    if (activity && new Date(activity.end_time).getTime() <= Date.now()) {
      return mockError('不能为已结束的活动新增题目', 400);
    }
    const title = String(formData.get('title') || '');
    const description = String(formData.get('description') || '');

    const newPhoto = {
      id: mockDb.photos.length + 1001,
      user_id: 1,
      user_nickname: '官方图寻账号',
      title,
      description,
      thumb_url: 'https://picsum.photos/300/200?random=' + Date.now(),
      image_url: 'https://picsum.photos/800/600?random=' + Date.now(),
      activity: { id: activityId, title: '图寻活动 #' + activityId, description: '活动描述' },
      solved: false,
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      status: 'approved' as const,
      created_at: new Date().toISOString()
    };

    mockDb.photos.unshift(newPhoto);
    return mockSuccess({ id: newPhoto.id, status: 'approved' }, '新增题目成功', 201);
  }),

  http.put('/api/admin/photos/:id', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const photo = mockDb.photos.find(item => item.id === id);
    if (!photo) return mockNotFound('题目不存在');

    const formData = await request.formData();
    if (formData.has('title')) photo.title = String(formData.get('title'));
    if (formData.has('description')) photo.description = String(formData.get('description'));

    return mockSuccess({ id: photo.id, status: photo.status }, '更新题目成功');
  })
];
