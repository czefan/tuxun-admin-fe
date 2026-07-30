import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockConflict, mockNotFound, mockSuccess } from '../response';

export const reviewHandlers = [
  // Photos review / Global photo pool
  http.get('/api/admin/photos', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();
    const activityIds = url.searchParams.getAll('activity_ids').map(Number).filter(Boolean);
    const solvedStr = url.searchParams.get('solved');

    let filtered = mockDb.photos;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (activityIds.length > 0) {
      filtered = filtered.filter(item => activityIds.includes(item.activity?.id || 101));
    }
    if (solvedStr === 'true') {
      filtered = filtered.filter(item => (item.solves_count ?? (item.solved ? 1 : 0)) > 0);
    } else if (solvedStr === 'false') {
      filtered = filtered.filter(item => (item.solves_count ?? (item.solved ? 1 : 0)) === 0);
    }
    if (keyword) {
      filtered = filtered.filter(
        item =>
          String(item.id).includes(keyword) ||
          item.title.toLowerCase().includes(keyword) ||
          (item.description || '').toLowerCase().includes(keyword) ||
          String(item.user_id).includes(keyword) ||
          (item.user_nickname || '').toLowerCase().includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => {
      const solves_count = item.solves_count ?? (item.solved ? 1 : 0);
      return {
        id: item.id,
        author: item.user_id ? mockDb.findUser(item.user_id) : null,
        title: item.title,
        description: item.description,
        thumb_url: item.thumb_url || `https://picsum.photos/300/200?random=${item.id}`,
        image_url: item.image_url || item.thumb_url || `https://picsum.photos/800/600?random=${item.id}`,
        location: { longitude: 120.123456, latitude: 30.123456, coord_type: 'gcj02' },
        activity: item.activity || { id: 101, title: '图寻校园打卡活动', description: '活动描述' },
        solved: solves_count > 0,
        solves_count,
        solved_count: solves_count,
        attempts_count: item.attempts_count ?? (solves_count > 0 ? 5 : 0),
        likes_count: item.likes_count ?? (solves_count > 0 ? 10 : 0),
        status: item.status,
        created_at: item.created_at
      };
    });

    return mockSuccess({ total: filtered.length, list });
  }),

  http.get('/api/photos/:id', ({ params }) => {
    const id = Number(params.id);
    const photo = mockDb.photos.find(item => item.id === id);
    if (!photo) return mockNotFound('未找到投稿详情');
    return mockSuccess({
      ...photo,
      author: mockDb.findUser(photo.user_id),
      activity: { id: 101, title: '图寻校园打卡活动' },
      solved: true,
      attempts_count: 12,
      likes_count: 5
    });
  }),

  http.get('/api/photos/:id/image', ({ params }) => {
    const id = Number(params.id);
    const photo = mockDb.photos.find(item => item.id === id);
    if (!photo) return mockNotFound('未找到图片文件');

    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49,
      0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return new HttpResponse(pngBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png'
      }
    });
  }),

  http.put('/api/admin/photos/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { action: 'approve' | 'reject'; reject_reason?: string };
    const photo = mockDb.photos.find(item => item.id === id);
    if (!photo) return mockNotFound('未找到该投稿审核记录');
    if (photo.status !== 'pending') return mockConflict('该投稿已被其他管理员审核');

    photo.status = body.action === 'approve' ? 'approved' : 'rejected';
    photo.reject_reason = body.reject_reason;
    return mockSuccess({ id: photo.id, status: photo.status }, '投稿审核状态已更新');
  }),

  // Attempts review
  http.get('/api/admin/attempts', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();

    let filtered = mockDb.attempts;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.question_title.toLowerCase().includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      id: item.id,
      photo: {
        id: 1001,
        title: item.question_title,
        thumb_url: 'https://picsum.photos/200?random=' + item.id,
        location: { longitude: 120.123456, latitude: 30.123456, coord_type: 'gcj02' }
      },
      user: mockDb.findUser(item.user_id),
      guess_image_url: 'https://picsum.photos/400?random=' + item.id,
      guess_location: { longitude: 120.125, latitude: 30.125, coord_type: 'gcj02' },
      status: item.status,
      reject_reason: item.reason || null,
      created_at: item.created_at
    }));
    return mockSuccess({ total: filtered.length, list });
  }),

  http.put('/api/admin/attempts/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { solved: 'solved' | 'unsolved'; reject_reason?: string };
    const attempt = mockDb.attempts.find(item => item.id === id);
    if (!attempt) return mockNotFound('未找到该答题记录');
    if (attempt.status !== 'pending') return mockConflict('该答题已被其他管理员处理');

    attempt.status = body.solved;
    attempt.reason = body.reject_reason;
    return mockSuccess({ id: attempt.id, status: attempt.status }, '答题审核结果已更新');
  }),

  // Comments review
  http.get('/api/admin/comments', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();

    let filtered = mockDb.comments;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item =>
          String(item.id).includes(keyword) ||
          item.content.toLowerCase().includes(keyword) ||
          item.user_nickname.toLowerCase().includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      id: item.id,
      photo: {
        id: 1001,
        title: '校园风景图寻打卡'
      },
      user: mockDb.findUser(item.user_id),
      content: item.content,
      status: item.status,
      reject_reason: item.reject_reason,
      created_at: item.created_at
    }));
    return mockSuccess({ total: filtered.length, list });
  }),

  http.put('/api/admin/comments/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { action: 'approve' | 'reject'; reject_reason?: string };
    const comment = mockDb.comments.find(item => item.id === id);
    if (!comment) return mockNotFound('未找到该评论记录');

    comment.status = body.action === 'approve' ? 'approved' : 'rejected';
    comment.reject_reason = body.reject_reason;
    return mockSuccess({ id: comment.id, status: comment.status }, '评论审核结果已更新');
  })
];
